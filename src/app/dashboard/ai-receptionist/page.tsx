import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  MessageSquareText,
  ShieldAlert,
  Clock3,
  Filter,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ConversationControls } from "@/components/dashboard/conversation-controls";
import { requireClinicUser } from "@/lib/auth/session";
import { getAiInbox } from "@/lib/dashboard/ai";
import type { AiConversationStatus } from "@/lib/dashboard/types";

export const metadata: Metadata = { title: "AI receptionist" };

// Every visit to the inbox reads live conversation rows.
export const instant = false;

const selectClassName =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const statusOptions: Array<{
  label: string;
  value: AiConversationStatus | "all";
}> = [
  { label: "All conversations", value: "all" },
  { label: "Active", value: "active" },
  { label: "Needs human", value: "needs_human" },
  { label: "Handed over", value: "handed_over" },
  { label: "Closed", value: "closed" },
];

const statusStyles: Record<AiConversationStatus, string> = {
  active: "border-emerald-600/20 bg-emerald-50 text-emerald-800",
  needs_human: "border-amber-600/20 bg-amber-50 text-amber-800",
  handed_over: "border-sky-600/20 bg-sky-50 text-sky-800",
  closed: "border-border bg-muted text-muted-foreground",
};

const statusLabels: Record<AiConversationStatus, string> = {
  active: "Active",
  needs_human: "Needs human",
  handed_over: "Handed over",
  closed: "Closed",
};

const roleLabels: Record<string, string> = {
  visitor: "Visitor",
  assistant: "AI",
  system: "System",
  tool: "Tool",
};

export default async function AiReceptionistPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireClinicUser();
  const params = await searchParams;
  const result = await getAiInbox({ status: params?.status });

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const flagged = result.conversations.reduce(
    (total, conversation) =>
      total +
      conversation.messages.filter((message) => Boolean(message.safetyFlag)).length,
    0,
  );
  const active = result.conversations.filter(
    (conversation) => conversation.status === "active",
  ).length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="AI receptionist"
        description="Review website conversations, flag unsafe messages, assign a human and close handled cases."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/ai-receptionist/knowledge">
                Knowledge base
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/ai-receptionist" target="_blank" rel="noreferrer">
                Open public chat
              </Link>
            </Button>
          </div>
        }
      />

      {!result.timezoneConfigured && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-600/20 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-900">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          The clinic timezone is not configured, so times are shown in UTC.
        </p>
      )}

      <form
        method="get"
        action="/dashboard/ai-receptionist"
        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Conversation status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={result.statusFilter}
            className={selectClassName}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline">
          <Filter data-icon="inline-start" />
          Apply filter
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/dashboard/ai-receptionist">Reset</Link>
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Conversations"
          value={result.conversations.length}
          helper={`${active} still active in this view`}
          icon={MessageSquareText}
        />
        <StatCard
          label="Flagged messages"
          value={flagged}
          helper="Messages with an emergency or medical-advice safety flag"
          icon={ShieldAlert}
        />
        <StatCard
          label="Assignments"
          value="Enabled"
          helper="Assign to a clinic user, close or return to the assistant"
          icon={CheckCircle2}
        />
      </div>

      {result.conversations.length === 0 ? (
        <Card className="gap-0 py-16 text-center shadow-soft ring-border/80">
          <MessageSquareText className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-3 font-heading text-2xl tracking-tight">
            No AI conversations yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Website conversations appear here after the public assistant records
            at least one exchange. Nothing is being simulated.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {result.conversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="gap-0 overflow-hidden py-0 shadow-soft ring-border/80"
            >
              <details className="group">
                <summary className="cursor-pointer list-none px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="line-clamp-1 text-sm font-semibold">
                          {conversation.title}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium",
                            statusStyles[conversation.status],
                          )}
                        >
                          {statusLabels[conversation.status]}
                        </span>
                        <Badge variant="outline" className="text-[0.65rem]">
                          {conversation.channel}
                        </Badge>
                        {conversation.assignedTo && (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[0.65rem] font-medium text-sky-800">
                            {conversation.assignedTo}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[0.68rem] text-muted-foreground">
                        Started {conversation.startedAtLabel} · {conversation.messageCount}{" "}
                        messages · last activity {conversation.lastMessageAtLabel}
                      </p>
                    </div>
                    <span className="text-[0.68rem] text-muted-foreground group-open:text-foreground">
                      {conversation.messages.length === 0 ? "No messages" : "Review conversation"}
                    </span>
                  </div>
                </summary>

                <div className="border-t border-border/70 bg-muted/20 px-5 py-4">
                  {conversation.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No messages were recorded for this conversation.
                    </p>
                  ) : (
                    <ol className="space-y-3">
                      {conversation.messages.map((message) => (
                        <li
                          key={message.id}
                          className={
                            message.role === "visitor"
                              ? "ml-0 max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 text-sm"
                              : "ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground"
                          }
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] opacity-80">
                              {roleLabels[message.role]}
                            </span>
                            <div className="flex items-center gap-2">
                              {message.safetyFlag && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.62rem] font-semibold text-amber-900">
                                  {message.safetyFlag}
                                </span>
                              )}
                              <span className="text-[0.62rem] opacity-70">
                                {message.createdAtLabel}
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-line leading-6">
                            {message.content}
                          </p>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
                <ConversationControls
                  conversationId={conversation.id}
                  status={conversation.status}
                />
              </details>
            </Card>
          ))}
        </div>
      )}

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-lg tracking-tight">What is not available</h2>
        </div>
        <p className="px-5 py-5 text-sm leading-6 text-muted-foreground">
          Staff can assign, close or return a conversation to the assistant.
          Email and WhatsApp delivery is not connected yet; reminders and
          cancellation notifications arrive in Milestone 9.
        </p>
      </Card>
    </div>
  );
}
