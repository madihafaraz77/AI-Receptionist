"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { FeedbackActionState } from "./action-state";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function setFeedbackStatusAction(
  _previousState: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const user = await getCurrentUser();

  if (!user) {
    return { status: "error", message: "Your session has expired. Sign in again." };
  }

  if (user.role !== "doctor" && user.role !== "staff") {
    return { status: "error", message: "Only an active clinic user can review feedback." };
  }

  const id = readText(formData, "id");
  const status = readText(formData, "status");
  const response = readText(formData, "response");

  if (!UUID_PATTERN.test(id)) {
    return { status: "error", message: "That feedback could not be found." };
  }

  if (
    status !== "reviewed" &&
    status !== "responded" &&
    status !== "archived"
  ) {
    return { status: "error", message: "Choose a supported feedback action." };
  }

  if (response.length > 1000) {
    return { status: "error", message: "Keep the response to 1,000 characters." };
  }

  if (status === "responded" && response.length < 10) {
    return {
      status: "error",
      message: "Write at least 10 characters of private response.",
    };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      status: "error",
      message: "Supabase is not configured. Add the keys and restart the app.",
    };
  }

  const { data: before, error: readError } = await supabase
    .from("feedback")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("[feedback] could not read current feedback", {
      code: readError.code,
      message: readError.message,
    });
    return { status: "error", message: "The feedback could not be updated." };
  }

  if (!before) {
    return { status: "error", message: "That feedback could not be found." };
  }

  const { data: after, error } = await supabase
    .from("feedback")
    .update({
      status,
      response: status === "responded" ? response : null,
      responded_by: status === "responded" ? user.id : null,
      responded_at: status === "responded" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[feedback] status update failed", {
      code: error.code,
      message: error.message,
    });
    return { status: "error", message: "The feedback could not be updated." };
  }

  await writeAuditEvent({
    action: `feedback.${status}`,
    actorId: user.id,
    actorType: user.role,
    tableName: "feedback",
    recordId: id,
    before,
    after,
  });

  revalidatePath("/dashboard/feedback");

  return {
    status: "success",
    message:
      status === "archived"
        ? "Feedback archived."
        : status === "responded"
          ? "Private response saved."
          : "Feedback marked reviewed.",
  };
}
