"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { parseFollowUpActionForm } from "@/lib/dashboard/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

import type { FollowUpActionState } from "./action-state";

const GENERIC_ERROR =
  "The follow-up could not be updated. Please try again or check the server logs.";

function friendlyError(message: string | undefined, code?: string): string {
  const value = `${code ?? ""} ${message ?? ""}`.toUpperCase();

  if (value.includes("FOLLOW_UP_NOT_FOUND")) {
    return "That follow-up could not be found.";
  }

  if (value.includes("ACTOR_NOT_ALLOWED")) {
    return "Only an active clinic user can change follow-ups.";
  }

  if (value.includes("UNSUPPORTED_STATUS_TRANSITION")) {
    return "That follow-up action is not supported.";
  }

  if (value.includes("CANCELLATION_REASON_REQUIRED")) {
    return "Enter a cancellation reason.";
  }

  if (value.includes("INVALID_CANCELLATION_REASON")) {
    return "Keep the cancellation reason to 500 characters or fewer.";
  }

  if (value.includes("FOLLOW_UP_ALREADY_CLOSED")) {
    return "That follow-up is already completed or cancelled.";
  }

  if (value.includes("INVALID_FOLLOW_UP_ACTION")) {
    return "Check the follow-up and try again.";
  }

  return GENERIC_ERROR;
}

/**
 * Marks a scheduled or sent follow-up as completed or cancelled.
 *
 * The service role is required because status actions are handled by a
 * transaction in Postgres. The caller is checked first; the function writes
 * the follow-up update and audit log together.
 */
export async function setFollowUpStatusAction(
  _previousState: FollowUpActionState,
  formData: FormData,
): Promise<FollowUpActionState> {
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
      message: "Only an active clinic user can change follow-ups.",
    };
  }

  const parsed = parseFollowUpActionForm(formData);

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
        "Follow-up actions need the server-side Supabase secret key. Add it and restart the app.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("set_follow_up_status", {
    p_follow_up_id: parsed.data.followUpId,
    p_to_status: parsed.data.status,
    p_actor_id: user.id,
    p_actor_type: user.role,
    p_cancellation_reason: parsed.data.cancellationReason,
  });

  if (error) {
    console.error("[follow-ups] status action rejected", {
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: friendlyError(error.message, error.code),
    };
  }

  revalidatePath("/dashboard/follow-ups");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message:
      parsed.data.status === "completed"
        ? "Follow-up marked completed. The audit log was updated."
        : "Follow-up cancelled. No reminder should be sent, and the reason is in the audit log.",
  };
}
