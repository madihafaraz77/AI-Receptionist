/**
 * Framework-free validation for dashboard AI-conversation status actions.
 */

export type AiConversationActionStatus =
  | "active"
  | "needs_human"
  | "handed_over"
  | "closed";

export type AiConversationActionInput = {
  conversationId: string;
  status: AiConversationActionStatus;
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

export function parseAiConversationActionForm(
  formData: FormData,
): ValidationResult<AiConversationActionInput> {
  const conversationId = readText(formData, "conversationId");
  const status = readText(formData, "status");
  const errors: FieldErrors = {};

  if (!UUID_PATTERN.test(conversationId)) {
    errors.conversationId = "That conversation could not be found.";
  }

  if (
    status !== "active" &&
    status !== "needs_human" &&
    status !== "handed_over" &&
    status !== "closed"
  ) {
    errors.status = "Choose a supported conversation action.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      conversationId,
      status: status as AiConversationActionStatus,
    },
  };
}
