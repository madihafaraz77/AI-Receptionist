"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { writeAuditEvent } from "@/lib/audit";
import { rateLimitPublicAction } from "@/lib/security/rate-limit";

import type { FeedbackSubmissionState } from "./action-state";

export async function submitFeedbackAction(
  _previousState: FeedbackSubmissionState,
  formData: FormData,
): Promise<FeedbackSubmissionState> {
  const allowed = await rateLimitPublicAction("feedback", 5, 60_000);

  if (!allowed.ok) {
    return {
      status: "error",
      message: "Too many feedback attempts. Please wait a minute and try again.",
    };
  }

  const ratingRaw = String(formData.get("rating") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  const rating = Number(ratingRaw);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { status: "error", message: "Choose a rating between 1 and 5." };
  }

  if (comment.length < 10 || comment.length > 1000) {
    return {
      status: "error",
      message: "Write feedback between 10 and 1,000 characters.",
    };
  }

  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return {
      status: "error",
      message:
        "Feedback is not connected yet. The clinic must configure Supabase before it can accept submissions.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("feedback")
    .insert({ rating, comment })
    .select("id")
    .single();

  if (error) {
    console.error("[feedback] could not submit feedback", {
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      message: "Your feedback could not be submitted. Try again later.",
    };
  }

  await writeAuditEvent({
    action: "feedback.created",
    actorId: null,
    actorType: "system",
    tableName: "feedback",
    recordId: data.id,
    after: { rating, comment },
  });

  return {
    status: "success",
    message: "Thank you. The clinic has received your private feedback.",
  };
}
