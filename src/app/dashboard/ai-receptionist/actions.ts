"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import {
  parseAiConversationActionForm,
  type FieldErrors,
} from "@/lib/ai/inbox-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type AiConversationActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialAiConversationActionState: AiConversationActionState = {
  status: "idle",
};

const GENERIC_ERROR =
  "The conversation could not be updated. Please try again or check the server logs.";

function friendlyError(message: string | undefined, code?: string): string {
  const value = `${code ?? ""} ${message ?? ""}`.toUpperCase();

  if (value.includes("AI_CONVERSATION_NOT_FOUND")) {
    return "That conversation could not be found.";
  }

  if (value.includes("ACTOR_NOT_ALLOWED")) {
    return "Only an active clinic user can update AI conversations.";
  }

  if (value.includes("AI_CONVERSATION_CLOSED")) {
    return "That conversation is already closed.";
  }

  if (value.includes("INVALID_AI_TRANSITION")) {
    return "That status change is not supported.";
  }

  if (value.includes("UNSUPPORTED_STATUS_TRANSITION")) {
    return "That status change is not supported.";
  }

  if (value.includes("INVALID_AI_ACTION")) {
    return "Check the conversation action and try again.";
  }

  return GENERIC_ERROR;
}

export async function setAiConversationStatusAction(
  _previousState: AiConversationActionState,
  formData: FormData,
): Promise<AiConversationActionState> {
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
      message: "Only an active clinic user can update AI conversations.",
    };
  }

  const parsed = parseAiConversationActionForm(formData);

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
        "AI conversation actions need the server-side Supabase secret key. Add it and restart the app.",
    };
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.rpc("set_ai_conversation_status", {
    p_conversation_id: parsed.data.conversationId,
    p_to_status: parsed.data.status,
    p_actor_id: user.id,
    p_actor_type: user.role,
  });

  if (error) {
    console.error("[ai-inbox] status action rejected", {
      code: error.code,
      message: error.message,
    });

    return {
      status: "error",
      message: friendlyError(error.message, error.code),
    };
  }

  revalidatePath("/dashboard/ai-receptionist");
  revalidatePath("/dashboard");

  const messages: Record<typeof parsed.data.status, string> = {
    active: "Conversation returned to the assistant. Assignment was cleared.",
    needs_human: "Conversation marked as needs human.",
    handed_over: "Conversation assigned to you and marked handed over.",
    closed: "Conversation closed. The audit log was updated.",
  };

  return { status: "success", message: messages[parsed.data.status] };
}
