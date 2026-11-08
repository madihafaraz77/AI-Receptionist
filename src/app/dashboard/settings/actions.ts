"use server";

import { revalidatePath, updateTag } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditEvent } from "@/lib/audit";
import { CLINIC_CONTENT_TAG } from "@/lib/clinic/data";
import {
  parseClinicSettingsForm,
  type FieldErrors,
} from "@/lib/clinic/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SettingsActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialSettingsState: SettingsActionState = { status: "idle" };

const GENERIC_ERROR =
  "The settings could not be saved. Please try again, or check the server logs if the problem continues.";

/**
 * Saves the singleton clinic settings row.
 *
 * Authorization is checked twice: the role is verified here, and the
 * `clinic_settings_doctor_update` policy only allows an active doctor to
 * update the row.
 */
export async function updateClinicSettingsAction(
  _previousState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "error",
      message: "Your session has expired. Sign in again to continue.",
    };
  }

  if (user.role !== "doctor") {
    return {
      status: "error",
      message: "Only the doctor account can change clinic settings.",
    };
  }

  const parsed = parseClinicSettingsForm(formData);

  if (!parsed.ok) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      errors: parsed.errors,
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message:
        "Supabase is not configured. Add the project keys and restart the app.",
    };
  }

  const { data: before, error: readError } = await supabase
    .from("clinic_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  if (readError) {
    console.error("[settings] could not read the current row", {
      code: readError.code,
      message: readError.message,
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  if (!before) {
    return {
      status: "error",
      message:
        "The clinic settings row is missing. Apply the seed migration before saving.",
    };
  }

  const values = parsed.data;

  const { data: after, error: updateError } = await supabase
    .from("clinic_settings")
    .update({
      name: values.name,
      address: values.address,
      phone: values.phone,
      email: values.email,
      timezone: values.timezone,
      doctor_name: values.doctorName,
      opening_time: values.openingTime,
      closing_time: values.closingTime,
      appointment_duration_minutes: values.appointmentDurationMinutes,
      daily_capacity: values.dailyCapacity,
      working_weekdays: values.workingWeekdays,
      booking_approval: values.bookingApproval,
      walk_ins_enabled: values.walkInsEnabled,
      consultation_fee_pkr: values.consultationFeePkr,
      online_consultation_enabled: values.onlineConsultationEnabled,
      follow_up_reminder_hours: values.followUpReminderHours,
      updated_by: user.id,
    })
    .eq("id", true)
    .select("*")
    .maybeSingle();

  if (updateError) {
    console.error("[settings] update failed", {
      code: updateError.code,
      message: updateError.message,
    });

    if (updateError.code === "42501") {
      return {
        status: "error",
        message: "Only the doctor account can change clinic settings.",
      };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  if (!after) {
    return { status: "error", message: GENERIC_ERROR };
  }

  await writeAuditEvent({
    action: "settings.updated",
    actorId: user.id,
    actorType: "doctor",
    tableName: "clinic_settings",
    recordId: null,
    before,
    after,
  });

  updateTag(CLINIC_CONTENT_TAG);
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message:
      "Clinic settings saved. The public website and booking rules now use these values.",
  };
}
