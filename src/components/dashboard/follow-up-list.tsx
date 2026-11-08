import Link from "next/link";
import { ArrowUpRight, CalendarCheck2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DashboardFollowUp } from "@/lib/dashboard/types";
import { cn, initials } from "@/lib/utils";

export function FollowUpList({ followUps }: { followUps: DashboardFollowUp[] }) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div>
          <h3 className="font-heading text-lg tracking-tight">
            Upcoming follow-ups
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Scheduled reviews due in the next 14 days
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/follow-ups">
            View all
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {followUps.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarCheck2 className="size-5" />
          </span>
          <p className="mt-3 text-sm font-medium">No upcoming follow-ups</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
            Scheduled reviews will appear here when a consultation plan includes
            one.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {followUps.map((followUp) => (
            <li
              key={followUp.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
            >
              <div className="w-20 shrink-0">
                <p className="text-xs font-semibold leading-5">
                  {followUp.dueLabel}
                </p>
                <p className="text-[0.65rem] tabular-nums text-muted-foreground">
                  {followUp.time}
                </p>
              </div>

              <Avatar className="hidden size-9 sm:flex">
                <AvatarFallback className="bg-brand-soft text-[0.68rem] font-semibold text-brand">
                  {initials(followUp.patientName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {followUp.patientName}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[0.65rem] uppercase tracking-[0.12em]",
                    followUp.reminderStatus === "sent"
                      ? "text-emerald-700"
                      : "text-muted-foreground",
                  )}
                >
                  {followUp.reminderStatus === "sent"
                    ? "Reminder sent"
                    : "Reminder scheduled"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
