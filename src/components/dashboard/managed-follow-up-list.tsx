import { BellRing, CalendarCheck2, Clock3 } from "lucide-react";

import { FollowUpStatusControls } from "@/components/dashboard/follow-up-status-controls";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ManagedFollowUp } from "@/lib/dashboard/types";
import { initials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const statusLabels: Record<ManagedFollowUp["status"], string> = {
  scheduled: "Scheduled",
  sent: "Reminder sent",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusStyles: Record<ManagedFollowUp["status"], string> = {
  scheduled: "border-amber-600/20 bg-amber-50 text-amber-800",
  sent: "border-sky-600/20 bg-sky-50 text-sky-800",
  completed: "border-emerald-600/20 bg-emerald-50 text-emerald-800",
  cancelled: "border-rose-600/20 bg-rose-50 text-rose-800",
};

export function ManagedFollowUpList({
  followUps,
  timezoneLabel,
}: {
  followUps: ManagedFollowUp[];
  timezoneLabel: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <h2 className="font-heading text-lg tracking-tight">Follow-ups</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Scheduled reviews, reminder hours and closure state. Completed or
            cancelled reviews stay in the audit log.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <CalendarCheck2 className="size-3" />
          {followUps.length} showing
        </Badge>
      </div>

      {followUps.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarCheck2 className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium">No follow-ups in this view</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Follow-ups are created when a consultation plan includes a review.
            Until then, this page stays honestly empty.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {followUps.map((followUp) => (
            <li key={followUp.id} className="bg-card transition-colors hover:bg-muted/15">
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-start">
                <div className="w-24 shrink-0">
                  <p className="text-sm font-semibold leading-5">
                    {followUp.dueLabel}
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums">
                    {followUp.time}
                  </p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    {timezoneLabel}
                  </p>
                </div>

                <Avatar className="hidden size-10 md:flex">
                  <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
                    {initials(followUp.patientName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {followUp.patientName}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.65rem] font-medium",
                        statusStyles[followUp.status],
                      )}
                    >
                      {statusLabels[followUp.status]}
                    </span>
                    {followUp.overdue && (
                      <span className="inline-flex items-center rounded-full border border-rose-600/20 bg-rose-50 px-2 py-0.5 text-[0.65rem] font-medium text-rose-700">
                        Overdue
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[0.68rem] text-muted-foreground">
                      {followUp.patientReference}
                    </span>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {followUp.patientPhone}
                    </span>
                    <span className="flex items-center gap-1 text-[0.68rem] text-muted-foreground">
                      <BellRing className="size-3" />
                      Reminder {followUp.reminderHours}h before
                    </span>
                  </div>
                  {followUp.notes && (
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                      “{followUp.notes}”
                    </p>
                  )}
                </div>
              </div>
              <FollowUpStatusControls
                followUpId={followUp.id}
                status={followUp.status}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border/70 bg-muted/25 px-5 py-2.5 text-[0.68rem] text-muted-foreground">
        <Clock3 className="mr-1 inline size-3 align-[-2px]" />
        Completed and cancelled follow-ups keep the audit trail. Reminder
        delivery is handled in Milestone 9.
      </div>
    </Card>
  );
}
