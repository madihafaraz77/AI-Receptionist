"use server";

import { revalidatePath } from "next/cache";

import {
  parseBookingDetailsForm,
  parseSlotRequestForm,
} from "@/lib/booking/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { rateLimitPublicAction } from "@/lib/security/rate-limit";
import { formatClinicTime } from "@/config/clinic";

import type { BookingState, SlotState } from "./action-state";

const GENERIC_ERROR =
  "The appointment could not be created. Please try again, or contact the clinic if the problem continues.";

function isBookingConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config?.url && config?.publishableKey && config?.secretKey);
}

function readableError(message: string | undefined, code?: string): string {
  const value = `${code ?? ""} ${message ?? ""}`.toUpperCase();

  if (value.includes("CLINIC_TIMEZONE_NOT_CONFIGURED")) {
    return "The clinic has not configured its timezone yet. Online booking opens after that is set in Clinic Settings.";
  }
  if (value.includes("CLINIC_SETTINGS_MISSING")) {
    return "The clinic settings row is missing. Apply the seed migration before opening booking.";
  }
  if (value.includes("SERVICE_NOT_AVAILABLE")) {
    return "That service is no longer available. Choose another service.";
  }
  if (value.includes("APPOINTMENT_IN_PAST")) {
    return "Choose a future date for the appointment.";
  }
  if (value.includes("APPOINTMENT_TOO_FAR_IN_ADVANCE")) {
    return "Choose a date within the next 90 days.";
  }
  if (value.includes("CLINIC_CLOSED")) {
    return "The clinic is closed on that day or that date is a closure.";
  }
  if (value.includes("OUTSIDE_CLINIC_HOURS")) {
    return "That time is outside clinic hours.";
  }
  if (value.includes("ONLINE_CONSULTATION_DISABLED")) {
    return "Online consultations are not currently available.";
  }
  if (value.includes("INVALID_FULL_NAME")) {
    return "Enter a full name between 2 and 120 characters.";
  }
  if (value.includes("INVALID_PHONE")) {
    return "Enter a valid phone number with 7 to 15 digits.";
  }
  if (value.includes("INVALID_EMAIL")) {
    return "Enter a valid email address.";
  }
  if (value.includes("INVALID_NOTES")) {
    return "Keep additional notes to 500 characters or fewer.";
  }
  if (value.includes("INVALID_BOOKING_DETAILS") || value.includes("INVALID_DETAILS")) {
    return "Check the appointment details and try again.";
  }
  if (
    value.includes("SLOT_TAKEN") ||
    value.includes("23P01") ||
    value.includes("EXCLUSION")
  ) {
    return "That appointment time is no longer available. Choose another time.";
  }
  if (value.includes("DAILY_CAPACITY_REACHED")) {
    return "The daily capacity is reached for that date. Choose another date.";
  }

  return GENERIC_ERROR;
}

type ServiceRow = {
  id: string;
  mode: "in_person" | "online";
};

async function findActiveService(
  serviceId: string,
): Promise<{ service?: ServiceRow; error?: string }> {
  // The service role is used server-side only, and the caller never receives
  // the key. This also keeps the active-service check independent of RLS.
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("services")
    .select("id, mode")
    .eq("id", serviceId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[booking] could not read the selected service", {
      code: error.code,
      message: error.message,
    });
    return { error: GENERIC_ERROR };
  }

  if (!data) {
    return { error: "That service is no longer available. Choose another service." };
  }

  return { service: data as ServiceRow };
}

function normaliseTime(value: string): string {
  // Postgres TIME values arrive as HH:MM:SS; the UI only needs HH:MM.
  return value.slice(0, 5);
}

export async function findAvailableSlotsAction(
  _previousState: SlotState,
  formData: FormData,
): Promise<SlotState> {
  if (!isBookingConfigured()) {
    return {
      status: "error",
      message:
        "Online booking is not connected yet. The clinic must configure Supabase and its secret key first.",
    };
  }

  const allowed = await rateLimitPublicAction("booking-availability", 15, 60_000);

  if (!allowed.ok) {
    return {
      status: "error",
      message: "Too many availability checks. Please wait a minute and try again.",
    };
  }

  const parsed = parseSlotRequestForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Check the selected service and date.",
      errors: parsed.errors,
    };
  }

  const active = await findActiveService(parsed.data.serviceId);

  if (active.error || !active.service) {
    return { status: "error", message: active.error ?? GENERIC_ERROR };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("get_available_slots", {
    p_appointment_date: parsed.data.appointmentDate,
    p_mode: active.service.mode,
  });

  if (error) {
    console.error("[booking] could not read availability", {
      code: error.code,
      message: error.message,
    });
    return { status: "error", message: readableError(error.message, error.code) };
  }

  const rows = (data ?? []) as Array<{ get_available_slots: string }>;
  const slots = rows.map((row) => {
    const time = normaliseTime(row.get_available_slots);

    return { time, label: formatClinicTime(time) };
  });

  if (slots.length === 0) {
    return {
      status: "success",
      message:
        "No genuine openings remain for that date and consultation type. Choose another date or call the clinic.",
      slots: [],
      selection: {
        serviceId: parsed.data.serviceId,
        appointmentDate: parsed.data.appointmentDate,
      },
    };
  }

  return {
    status: "success",
    message: "These are the currently genuine openings for the selected date.",
    slots,
    selection: {
      serviceId: parsed.data.serviceId,
      appointmentDate: parsed.data.appointmentDate,
    },
  };
}

export async function createBookingAction(
  _previousState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  if (!isBookingConfigured()) {
    return {
      status: "error",
      message:
        "Online booking is not connected yet. The clinic must configure Supabase and its secret key first.",
    };
  }

  const allowed = await rateLimitPublicAction("booking-create", 3, 60_000);

  if (!allowed.ok) {
    return {
      status: "error",
      message:
        "Too many booking attempts. Please wait a minute, then try again or contact the clinic directly.",
    };
  }

  const parsed = parseBookingDetailsForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      errors: parsed.errors,
    };
  }

  const active = await findActiveService(parsed.data.serviceId);

  if (active.error || !active.service) {
    return { status: "error", message: active.error ?? GENERIC_ERROR };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("create_website_booking", {
    p_full_name: parsed.data.fullName,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
    p_service_id: parsed.data.serviceId,
    p_appointment_date: parsed.data.appointmentDate,
    p_start_time: parsed.data.startTime,
    p_mode: active.service.mode,
    p_patient_notes: parsed.data.notes,
  });

  if (error) {
    console.error("[booking] booking function rejected the request", {
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: readableError(error.message, error.code),
    };
  }

  const row = data as {
    reference: string;
    status: "confirmed" | "pending";
    appointment_date: string;
    start_time: string;
    mode: "in_person" | "online";
    fee_pkr: number;
  } | null;

  if (!row) {
    console.error("[booking] booking function returned no row");
    return { status: "error", message: GENERIC_ERROR };
  }

  // Booking changes overview counts and today's schedule.
  revalidatePath("/book");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message:
      row.status === "confirmed"
        ? "The appointment is confirmed. Please keep the reference shown below."
        : "The appointment request has been received and is waiting for the clinic to approve it.",
    appointment: {
      reference: row.reference,
      status: row.status,
      appointmentDate: row.appointment_date,
      startTime: normaliseTime(row.start_time),
      mode: row.mode,
      feePkr: row.fee_pkr,
    },
  };
}
