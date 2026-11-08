import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type FeedbackItem = {
  id: string;
  rating: number;
  comment: string | null;
  status: "new" | "reviewed" | "responded" | "archived";
  response: string | null;
  createdAtLabel: string;
};

export type FeedbackData =
  | { status: "ok"; items: FeedbackItem[] }
  | { status: "unconfigured" }
  | { status: "needs_migration" }
  | { status: "error" };

type FeedbackRow = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  response: string | null;
  created_at: string;
};

type QueryProblem = { status: "needs_migration" } | { status: "error" };

function classifyError(
  error: { code?: string; message?: string } | null,
): QueryProblem | null {
  if (!error) return null;

  const message = error.message ?? "";

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|does not exist/i.test(message)
  ) {
    return { status: "needs_migration" };
  }

  console.error("[feedback] Supabase query failed", {
    code: error.code,
    message,
  });

  return { status: "error" };
}

const statuses = ["new", "reviewed", "responded", "archived"] as const;
type FeedbackStatus = (typeof statuses)[number];

function normalizeStatus(value: string): FeedbackStatus {
  return statuses.includes(value as FeedbackStatus)
    ? (value as FeedbackStatus)
    : "new";
}

/** Reads private feedback for clinic users. Patients can submit, not read. */
export async function getFeedback(): Promise<FeedbackData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const { data, error } = await supabase
    .from("feedback")
    .select("id, rating, comment, status, response, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const problem = classifyError(error);
  if (problem) return problem;

  return {
    status: "ok",
    items: ((data ?? []) as FeedbackRow[]).map((row) => ({
      id: row.id,
      rating: row.rating,
      comment: row.comment,
      status: normalizeStatus(row.status),
      response: row.response,
      createdAtLabel: new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "UTC",
      }).format(new Date(row.created_at)),
    })),
  };
}
