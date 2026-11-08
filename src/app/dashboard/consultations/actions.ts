"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type ConsultationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialConsultationActionState: ConsultationActionState = {
  status: "idle",
};

const GENERIC_ERROR =
  "The consultation could not be saved. Please try again or check the server logs.";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function isDateKey(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [, year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export async function createConsultationAction(
  _previousState: ConsultationActionState,
  formData: FormData,
): Promise<ConsultationActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return { status: "error", message: "Your session has expired." };
  }

  if (user.role !== "doctor") {
    return {
      status: "error",
      message: "Only the doctor account can write consultation records.",
    };
  }

  const appointmentId = readText(formData, "appointmentId");
  const chiefComplaint = readOptionalText(formData, "chiefComplaint");
  const history = readOptionalText(formData, "history");
  const examination = readOptionalText(formData, "examination");
  const assessment = readOptionalText(formData, "assessment");
  const plan = readOptionalText(formData, "plan");
  const privateNotes = readOptionalText(formData, "privateNotes");
  const remedyName = readOptionalText(formData, "remedyName");
  const potency = readOptionalText(formData, "potency");
  const dosage = readOptionalText(formData, "dosage");
  const frequency = readOptionalText(formData, "frequency");
  const durationRaw = readText(formData, "durationDays");
  const instructions = readOptionalText(formData, "instructions");
  const followUpDate = readOptionalText(formData, "followUpDate");

  if (!UUID_PATTERN.test(appointmentId)) {
    return {
      status: "error",
      message: "Choose a valid appointment to link this consultation.",
    };
  }

  const requiresNotes =
    remedyName || potency || dosage || frequency || durationRaw || instructions;

  if (requiresNotes && !remedyName) {
    return {
      status: "error",
      message: "Add the remedy name if you are recording a prescription.",
    };
  }

  if (remedyName && remedyName.length > 200) {
    return { status: "error", message: "Keep the remedy name to 200 characters." };
  }

  if (instructions && instructions.length > 1000) {
    return {
      status: "error",
      message: "Keep prescription instructions to 1,000 characters.",
    };
  }

  let durationDays: number | null = null;

  if (durationRaw) {
    if (!/^\d+$/.test(durationRaw)) {
      return {
        status: "error",
        message: "Enter a whole number of days for the prescription duration.",
      };
    }

    durationDays = Number(durationRaw);

    if (durationDays < 1 || durationDays > 365) {
      return {
        status: "error",
        message: "Enter a prescription duration between 1 and 365 days.",
      };
    }
  }

  if (followUpDate && !isDateKey(followUpDate)) {
    return { status: "error", message: "Enter a valid follow-up date." };
  }

  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return {
      status: "error",
      message:
        "Consultation records need the server-side Supabase secret key. Add it and restart the app.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("id, patient_id")
    .eq("id", appointmentId)
    .maybeSingle();

  if (appointmentError) {
    console.error("[consultations] could not read appointment", {
      code: appointmentError.code,
      message: appointmentError.message,
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  if (!appointment) {
    return {
      status: "error",
      message: "That appointment could not be found.",
    };
  }

  const { data, error } = await admin.rpc("create_consultation_record", {
    p_patient_id: appointment.patient_id,
    p_appointment_id: appointment.id,
    p_doctor_id: user.id,
    p_chief_complaint: chiefComplaint,
    p_history: history,
    p_examination: examination,
    p_assessment: assessment,
    p_plan: plan,
    p_private_notes: privateNotes,
    p_remedy_name: remedyName,
    p_potency: potency,
    p_dosage_text: dosage,
    p_frequency_text: frequency,
    p_duration_days: durationDays,
    p_prescription_instructions: instructions,
    p_follow_up_date: followUpDate,
  });

  if (error) {
    console.error("[consultations] create failed", {
      code: error.code,
      message: error.message,
    });

    if (error.message?.includes("CLINICAL_WRITE_DOCTOR_ONLY")) {
      return {
        status: "error",
        message: "Only the doctor account can write consultation records.",
      };
    }

    if (error.message?.includes("FOLLOW_UP_DATE_IN_PAST")) {
      return { status: "error", message: "Choose a future follow-up date." };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  revalidatePath("/dashboard/consultations");
  revalidatePath("/dashboard/patients");
  revalidatePath("/dashboard/follow-ups");
  revalidatePath("/dashboard");

  const consultationId =
    data && typeof data === "object" && "consultation_id" in data
      ? String((data as { consultation_id: unknown }).consultation_id)
      : "created";

  return {
    status: "success",
    message: `Consultation recorded (${consultationId}).`,
  };
}
