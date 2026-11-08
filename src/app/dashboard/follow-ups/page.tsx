import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  Filter,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { ManagedFollowUpList } from "@/components/dashboard/managed-follow-up-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getDashboardFollowUps } from "@/lib/dashboard/data";
import type { ManagedFollowUp } from "@/lib/dashboard/types";

export const metadata: Metadata = { title: "Follow-ups" };

// Follow-up status actions change live records on every request.
export const instant = false;

const selectClassName =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const statusOptions: Array<{
  label: string;
  value: ManagedFollowUp["status"] | "all";
}> = [
  { label: "All statuses", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Reminder sent", value: "sent" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireClinicUser();
  const params = await searchParams;
  const result = await getDashboardFollowUps({ status: params?.status });

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const openCount = result.followUps.filter(
    (followUp) => followUp.status === "scheduled" || followUp.status === "sent",
  ).length;
  const overdueCount = result.followUps.filter((followUp) => followUp.overdue).length;
  const completedCount = result.followUps.filter(
    (followUp) => followUp.status === "completed",
  ).length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Follow-ups"
        description="Review scheduled follow-up visits, overdue reminders and closure state. Clinical note writing is not available here."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/appointments">Open appointments</Link>
          </Button>
        }
      />

      {!result.timezoneConfigured && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-600/20 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-900">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          The clinic timezone is not configured, so follow-up times are shown in
          UTC. Set it in Clinic Settings before relying on “today”.
        </p>
      )}

      <form
        method="get"
        action="/dashboard/follow-ups"
        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status
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
          <Link href="/dashboard/follow-ups">Reset</Link>
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Open follow-ups"
          value={openCount}
          helper="Scheduled or reminder sent, based on this filter"
          icon={BellRing}
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          helper="Due time has passed but the review is still open"
          icon={AlertTriangle}
        />
        <StatCard
          label="Completed"
          value={completedCount}
          helper="Marked complete by the clinic from this screen"
          icon={CheckCircle2}
        />
      </div>

      <ManagedFollowUpList
        followUps={result.followUps}
        timezoneLabel={result.timezoneConfigured ? result.timezone : "UTC fallback"}
      />

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-lg tracking-tight">
            What is included here
          </h2>
        </div>
        <p className="px-5 py-5 text-sm leading-6 text-muted-foreground">
          This screen reviews and closes follow-ups. Creating the follow-up
          itself comes from the consultation workflow; attachment uploads,
          prescription writing and clinical notes remain separate clinical
          records. No email or WhatsApp reminder is sent yet; delivery arrives
          in Milestone 9.
        </p>
      </Card>
    </div>
  );
}
