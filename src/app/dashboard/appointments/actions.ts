"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { parseAppointmentActionForm } from "@/lib/dashboard/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

import type { AppointmentActionState } from "./action-state";

const GENERIC_ERROR =
  "The appointment could not be updated. Please try again or check the server logs.";

function friendlyError(message: string | undefined, code?: string): string {
  const value = `${code ?? ""} ${message ?? ""}`.toUpperCase();

  if (value.includes("APPOINTMENT_NOT_FOUND")) {
    return "That appointment could not be found.";
  }

  if (value.includes("ACTOR_NOT_ALLOWED")) {
    return "Only an active clinic user can change appointments.";
  }

  if (value.includes("UNSUPPORTED_STATUS_TRANSITION")) {
    return "That status change is not supported.";
  }

  if (value.includes("CANCELLATION_REASON_REQUIRED")) {
    return "Enter a cancellation reason.";
  }

  if (value.includes("INVALID_CANCELLATION_REASON")) {
    return "Keep the cancellation reason to 500 characters or fewer.";
  }

  if (value.includes("INVALID_APPOINTMENT_TRANSITION")) {
    return "Only pending or confirmed appointments can be completed or cancelled. Pending appointments can be confirmed.";
  }

  if (value.includes("INVALID_APPOINTMENT_ACTION")) {
    return "Check the appointment and try again.";
  }

  return GENERIC_ERROR;
}

/**
 * Confirms, completes or cancels an appointment.
 *
 * The service role is used because appointment write policies are intentionally
 * removed. The caller is checked first; the Postgres function performs the
 * transition, event row and audit row inside one transaction.
 */
export async function setAppointmentStatusAction(
  _previousState: AppointmentActionState,
  formData: FormData,
): Promise<AppointmentActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (user.role !== "doctor" && user.role !== "staff") {
    return {
      status: "error",
      message: "Only an active clinic user can change appointments.",
    };
  }

  const parsed = parseAppointmentActionForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Check the action and try again.",
      errors: parsed.errors,
    };
  }

  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return {
      status: "error",
      message:
        "Appointment actions need the server-side Supabase secret key. Add it and restart the app.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("set_appointment_status", {
    p_appointment_id: parsed.data.appointmentId,
    p_to_status: parsed.data.status,
    p_actor_id: user.id,
    p_actor_type: user.role,
    p_cancellation_reason: parsed.data.cancellationReason,
  });

  if (error) {
    console.error("[appointments] status action rejected", {
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: friendlyError(error.message, error.code),
    };
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");

  const messages: Record<typeof parsed.data.status, string> = {
    confirmed: "Appointment confirmed. The patient record and audit log were updated.",
    completed: "Appointment marked completed. The appointment event and audit log were updated.",
    cancelled: "Appointment cancelled. The slot is available again and the reason is in the audit log.",
  };

  return { status: "success", message: messages[parsed.data.status] };
}
