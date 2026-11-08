"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth/session";
import { writeAuditEvent } from "@/lib/audit";
import {
  parseKnowledgeEntryForm,
  type FieldErrors,
} from "@/lib/ai/knowledge-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type KnowledgeActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialKnowledgeActionState: KnowledgeActionState = {
  status: "idle",
};

const GENERIC_ERROR =
  "The approved knowledge entry could not be saved. Please try again or check the server logs.";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function authoriseDoctor() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false as const,
      state: { status: "error" as const, message: "Your session has expired. Sign in again." },
    };
  }

  if (user.role !== "doctor") {
    return {
      ok: false as const,
      state: {
        status: "error" as const,
        message: "Only the doctor account can manage approved AI knowledge entries.",
      },
    };
  }

  return { ok: true as const, user };
}

function payload(values: {
  title: string;
  category: string;
  content: string;
  isActive: boolean;
}) {
  return {
    title: values.title,
    category: values.category,
    content: values.content,
    is_active: values.isActive,
  };
}

export async function createKnowledgeEntryAction(
  _previousState: KnowledgeActionState,
  formData: FormData,
): Promise<KnowledgeActionState> {
  const authorised = await authoriseDoctor();

  if (!authorised.ok) {
    return authorised.state;
  }

  const parsed = parseKnowledgeEntryForm(formData);

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
        "Supabase is not configured. Add the server keys and restart the app.",
    };
  }

  const { data: after, error } = await supabase
    .from("ai_knowledge_entries")
    .insert({
      ...payload(parsed.data),
      updated_by: authorised.user.id,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[ai-knowledge] create failed", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "42501") {
      return {
        status: "error",
        message: "Only the doctor account can manage approved AI knowledge entries.",
      };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  await writeAuditEvent({
    action: "ai_knowledge.created",
    actorId: authorised.user.id,
    actorType: "doctor",
    tableName: "ai_knowledge_entries",
    recordId: after?.id ?? null,
    after,
  });

  revalidatePath("/dashboard/ai-receptionist/knowledge");
  revalidatePath("/dashboard/ai-receptionist");
  revalidatePath("/ai-receptionist");

  return {
    status: "success",
    message: `“${parsed.data.title}” was added to the approved knowledge base.`,
  };
}

export async function updateKnowledgeEntryAction(
  _previousState: KnowledgeActionState,
  formData: FormData,
): Promise<KnowledgeActionState> {
  const authorised = await authoriseDoctor();

  if (!authorised.ok) {
    return authorised.state;
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!UUID_PATTERN.test(id)) {
    return { status: "error", message: "That knowledge entry could not be found." };
  }

  const parsed = parseKnowledgeEntryForm(formData);

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
        "Supabase is not configured. Add the server keys and restart the app.",
    };
  }

  const { data: before, error: readError } = await supabase
    .from("ai_knowledge_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (readError) {
    console.error("[ai-knowledge] could not read current row", {
      code: readError.code,
      message: readError.message,
    });
    return { status: "error", message: GENERIC_ERROR };
  }

  if (!before) {
    return { status: "error", message: "That knowledge entry could not be found." };
  }

  const { data: after, error } = await supabase
    .from("ai_knowledge_entries")
    .update({
      ...payload(parsed.data),
      updated_by: authorised.user.id,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[ai-knowledge] update failed", {
      code: error.code,
      message: error.message,
    });

    if (error.code === "42501") {
      return {
        status: "error",
        message: "Only the doctor account can manage approved AI knowledge entries.",
      };
    }

    return { status: "error", message: GENERIC_ERROR };
  }

  if (!after) {
    return { status: "error", message: GENERIC_ERROR };
  }

  await writeAuditEvent({
    action: "ai_knowledge.updated",
    actorId: authorised.user.id,
    actorType: "doctor",
    tableName: "ai_knowledge_entries",
    recordId: id,
    before,
    after,
  });

  revalidatePath("/dashboard/ai-receptionist/knowledge");
  revalidatePath("/dashboard/ai-receptionist");
  revalidatePath("/ai-receptionist");

  return {
    status: "success",
    message: `“${parsed.data.title}” was updated. The assistant uses active entries only.`,
  };
}
