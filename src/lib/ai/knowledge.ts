import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type AiKnowledgeEntry = {
  id: string;
  title: string;
  category: "hours" | "services" | "fees" | "policies" | "faq";
  content: string;
  isActive: boolean;
  updatedAt: string;
};

type KnowledgeRow = {
  id: string;
  title: string;
  category: string;
  content: string;
  is_active: boolean;
  updated_at: string;
};

type QueryProblem = { status: "needs_migration" } | { status: "error" };

const CATEGORIES: AiKnowledgeEntry["category"][] = [
  "hours",
  "services",
  "fees",
  "policies",
  "faq",
];

function classifyError(error: { code?: string; message?: string } | null): QueryProblem | null {
  if (!error) return null;

  const message = error.message ?? "";

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|does not exist/i.test(message)
  ) {
    return { status: "needs_migration" };
  }

  console.error("[ai-knowledge] Supabase query failed", {
    code: error.code,
    message,
  });

  return { status: "error" };
}

function mapRow(row: KnowledgeRow): AiKnowledgeEntry {
  const category = CATEGORIES.includes(row.category as AiKnowledgeEntry["category"])
    ? (row.category as AiKnowledgeEntry["category"])
    : "faq";

  return {
    id: row.id,
    title: row.title,
    category,
    content: row.content,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

export type DashboardKnowledgeResult =
  | { status: "ok"; entries: AiKnowledgeEntry[] }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };

/** Doctor and staff can read the approved catalogue through RLS. */
export async function getDashboardAiKnowledgeEntries(): Promise<DashboardKnowledgeResult> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const { data, error } = await supabase
    .from("ai_knowledge_entries")
    .select("id, title, category, content, is_active, updated_at")
    .order("category", { ascending: true })
    .order("title", { ascending: true })
    .limit(100);

  const problem = classifyError(error);
  if (problem) return problem;

  return {
    status: "ok",
    entries: ((data ?? []) as KnowledgeRow[]).map(mapRow),
  };
}

/**
 * Reads only active approved entries for the model prompt. The AI never gets
 * inactive, draft or unknown-source content.
 */
export async function getApprovedAiKnowledgeEntries(): Promise<AiKnowledgeEntry[]> {
  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_knowledge_entries")
    .select("id, title, category, content, is_active, updated_at")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[ai-knowledge] could not read approved knowledge entries", {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  return ((data ?? []) as KnowledgeRow[]).map(mapRow);
}
