import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  ChevronDown,
  Globe2,
  MessageSquareText,
  Pencil,
  Plus,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getDashboardAiKnowledgeEntries } from "@/lib/ai/knowledge";

import { KnowledgeForm } from "./knowledge-form";

export const metadata: Metadata = { title: "AI knowledge base" };

export const instant = false;

const categoryLabels = {
  hours: "Hours",
  services: "Services",
  fees: "Fees",
  policies: "Policies",
  faq: "FAQ",
} as const;

export default async function AiKnowledgePage() {
  const user = await requireClinicUser();
  const result = await getDashboardAiKnowledgeEntries();

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const canEdit = user.role === "doctor";
  const active = result.entries.filter((entry) => entry.isActive).length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="AI knowledge base"
        description="Approved clinic facts the assistant may use. Inactive entries stay hidden from the model prompt but remain auditable."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/ai-receptionist">
              <MessageSquareText data-icon="inline-start" />
              Back to inbox
            </Link>
          </Button>
        }
      />

      {!canEdit && (
        <p className="rounded-xl border border-amber-600/20 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          You can review approved entries. Only the doctor account can add,
          change or deactivate them.
        </p>
      )}

      {canEdit && (
        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <Plus className="size-4" />
                </span>
                <div>
                  <p className="font-heading text-lg tracking-tight">Add approved knowledge</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    The assistant answers from these entries plus confirmed settings and services.
                  </p>
                </div>
              </div>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border/70 px-5 py-5">
              <KnowledgeForm mode="create" />
            </div>
          </details>
        </Card>
      )}

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
          <div>
            <h2 className="font-heading text-lg tracking-tight">Approved entries</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {active} active{" "}
              {result.entries.length - active > 0
                ? `· ${result.entries.length - active} inactive`
                : ""}
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <BookOpenCheck className="size-3" />
            Assistant knowledge
          </Badge>
        </div>

        {result.entries.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <BookOpenCheck className="size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No approved knowledge yet</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Add clinic policies and FAQs here. Until then, the assistant has no
              approved answers beyond clinic settings and services.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {result.entries.map((entry) =>
              canEdit ? (
                <li key={entry.id} className="bg-card">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold">{entry.title}</p>
                          <Badge variant="outline" className="text-[0.65rem]">
                            {categoryLabels[entry.category]}
                          </Badge>
                          {entry.isActive ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
                          {entry.content}
                        </p>
                      </div>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground group-open:text-foreground">
                        <Pencil className="size-3.5" />
                        Edit
                        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="border-t border-border/70 px-5 py-5">
                      <KnowledgeForm mode="edit" entry={entry} />
                    </div>
                  </details>
                </li>
              ) : (
                <li key={entry.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{entry.title}</p>
                    <Badge variant="outline" className="text-[0.65rem]">
                      {categoryLabels[entry.category]}
                    </Badge>
                    {entry.isActive ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {entry.content}
                  </p>
                </li>
              ),
            )}
          </ul>
        )}
      </Card>

      <p className="pb-2 text-center text-[0.68rem] text-muted-foreground">
        <Globe2 className="mr-1 inline size-3 align-[-2px]" />
        Only the doctor can write these entries. The assistant never learns from
        unapproved content.
      </p>
    </div>
  );
}
