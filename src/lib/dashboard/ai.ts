import "server-only";

import { formatRelativeTime, formatTimeInZone } from "@/lib/dashboard/date";
import type {
  AiConversationStatus,
  DashboardAiConversation,
  DashboardAiInboxData,
  DashboardAiMessage,
} from "@/lib/dashboard/types";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ConversationRow = {
  id: string;
  channel: string;
  status: string;
  assigned_to: string | null;
  started_at: string;
  last_message_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  safety_flag: string | null;
  created_at: string;
};

type SupabaseError = { code?: string; message?: string } | null;

const STATUSES: AiConversationStatus[] = [
  "active",
  "needs_human",
  "handed_over",
  "closed",
];

function normalizeStatus(value: string): AiConversationStatus {
  return STATUSES.includes(value as AiConversationStatus)
    ? (value as AiConversationStatus)
    : "active";
}

function readStatusFilter(value: string | undefined): AiConversationStatus | "all" {
  return STATUSES.includes(value as AiConversationStatus)
    ? (value as AiConversationStatus)
    : "all";
}

function classifyError(error: SupabaseError): Exclude<DashboardAiInboxData, { status: "ok" }> | null {
  if (!error) return null;

  const message = error.message ?? "";

  if (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|does not exist/i.test(message)
  ) {
    return { status: "needs_migration" };
  }

  console.error("[ai-inbox] Supabase query failed", {
    code: error.code,
    message,
  });

  return { status: "error" };
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

export async function getAiInbox(
  options: { status?: string } = {},
): Promise<DashboardAiInboxData> {
  if (!getSupabaseConfig()) {
    return { status: "unconfigured" };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const now = new Date();
  const settingsResult = await supabase
    .from("clinic_settings")
    .select("timezone")
    .eq("id", true)
    .maybeSingle();

  const settingsError = classifyError(settingsResult.error);
  if (settingsError) return settingsError;

  const settings = settingsResult.data as { timezone: string | null } | null;
  const timezone = settings?.timezone ?? "UTC";
  const statusFilter = readStatusFilter(options.status);

  let conversationsQuery = supabase
    .from("ai_conversations")
    .select("id, channel, status, assigned_to, started_at, last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(50);

  if (statusFilter !== "all") {
    conversationsQuery = conversationsQuery.eq("status", statusFilter);
  }

  const conversationsResult = await conversationsQuery;

  const queryError = classifyError(conversationsResult.error);
  if (queryError) return queryError;

  const conversationRows = (conversationsResult.data ?? []) as ConversationRow[];
  const conversationIds = conversationRows.map((row) => row.id);

  let messageRows: MessageRow[] = [];

  if (conversationIds.length > 0) {
    const messagesResult = await supabase
      .from("ai_messages")
      .select("id, conversation_id, role, content, safety_flag, created_at")
      .in("conversation_id", conversationIds)
      .order("created_at", { ascending: true })
      .limit(500);

    const messagesError = classifyError(messagesResult.error);
    if (messagesError) return messagesError;

    messageRows = (messagesResult.data ?? []) as MessageRow[];
  }

  const assignedIds = Array.from(
    new Set(
      conversationRows
        .map((row) => row.assigned_to)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const assignedNames = new Map<string, string>();

  if (assignedIds.length > 0) {
    const profilesResult = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", assignedIds);

    const profilesError = classifyError(profilesResult.error);
    if (profilesError) return profilesError;

    for (const profile of (profilesResult.data ?? []) as Array<{
      id: string;
      full_name: string;
    }>) {
      assignedNames.set(profile.id, profile.full_name);
    }
  }

  const messagesByConversation = new Map<string, DashboardAiMessage[]>();

  for (const row of messageRows) {
    const role =
      row.role === "visitor" || row.role === "assistant" || row.role === "system" || row.role === "tool"
        ? row.role
        : "assistant";

    const message: DashboardAiMessage = {
      id: row.id,
      role,
      content: row.content,
      safetyFlag: row.safety_flag,
      createdAtLabel: formatTimeInZone(row.created_at, timezone),
    };

    const list = messagesByConversation.get(row.conversation_id);

    if (list) {
      list.push(message);
    } else {
      messagesByConversation.set(row.conversation_id, [message]);
    }
  }

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  });

  const conversations: DashboardAiConversation[] = conversationRows.map(
    (row) => {
      const messages = messagesByConversation.get(row.id) ?? [];
      const firstVisitorMessage = messages.find((message) => message.role === "visitor");
      const fallbackTitle = "Website visitor";

      return {
        id: row.id,
        title: firstVisitorMessage ? truncate(firstVisitorMessage.content, 72) : fallbackTitle,
        status: normalizeStatus(row.status),
        channel: row.channel,
        assignedTo: row.assigned_to
          ? (assignedNames.get(row.assigned_to) ?? "Assigned clinic user")
          : null,
        startedAtLabel: dateLabel.format(new Date(row.started_at)),
        lastMessageAtLabel: formatRelativeTime(row.last_message_at, now),
        messageCount: messages.length,
        messages,
      };
    },
  );

  return {
    status: "ok",
    timezone,
    timezoneConfigured: Boolean(settings?.timezone),
    statusFilter,
    conversations,
  };
}
