/**
 * Framework-free validation for appointment-management Server Actions.
 * The browser selects an action, but it never decides whether it is allowed.
 */

export type AppointmentActionStatus = "confirmed" | "completed" | "cancelled";

export type AppointmentActionInput = {
  appointmentId: string;
  status: AppointmentActionStatus;
  cancellationReason: string | null;
};

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: FieldErrors };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

export type FollowUpActionStatus = "completed" | "cancelled";

export type FollowUpActionInput = {
  followUpId: string;
  status: FollowUpActionStatus;
  cancellationReason: string | null;
};

export function parseFollowUpActionForm(
  formData: FormData,
): ValidationResult<FollowUpActionInput> {
  const followUpId = readText(formData, "followUpId");
  const status = readText(formData, "status");
  const cancellationReason = readOptionalText(formData, "cancellationReason");
  const errors: FieldErrors = {};

  if (!UUID_PATTERN.test(followUpId)) {
    errors.followUpId = "That follow-up could not be found.";
  }

  if (status !== "completed" && status !== "cancelled") {
    errors.status = "Choose a supported follow-up action.";
  }

  if (cancellationReason !== null && cancellationReason.length > 500) {
    errors.cancellationReason =
      "Keep the cancellation reason to 500 characters or fewer.";
  }

  if (status === "cancelled" && !cancellationReason) {
    errors.cancellationReason =
      "Enter a short reason so the clinic understands why the follow-up was cancelled.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      followUpId,
      status: status as FollowUpActionStatus,
      cancellationReason,
    },
  };
}

export function parseAppointmentActionForm(
  formData: FormData,
): ValidationResult<AppointmentActionInput> {
  const appointmentId = readText(formData, "appointmentId");
  const status = readText(formData, "status");
  const cancellationReason = readOptionalText(formData, "cancellationReason");
  const errors: FieldErrors = {};

  if (!UUID_PATTERN.test(appointmentId)) {
    errors.appointmentId = "That appointment could not be found.";
  }

  if (
    status !== "confirmed" &&
    status !== "completed" &&
    status !== "cancelled"
  ) {
    errors.status = "Choose a supported appointment action.";
  }

  if (cancellationReason !== null && cancellationReason.length > 500) {
    errors.cancellationReason =
      "Keep the cancellation reason to 500 characters or fewer.";
  }

  if (status === "cancelled" && !cancellationReason) {
    errors.cancellationReason =
      "Enter a short reason so the patient and staff can understand the cancellation.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      appointmentId,
      status: status as AppointmentActionStatus,
      cancellationReason,
    },
  };
}
