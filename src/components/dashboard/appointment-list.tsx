import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";

import {
  AppointmentStatusBadge,
  AppointmentTypeBadge,
  BookingSourceLabel,
} from "@/components/dashboard/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatClinicTime } from "@/config/clinic";
import type { DashboardAppointment } from "@/lib/dashboard/types";
import { initials } from "@/lib/utils";

type AppointmentListProps = {
  appointments: DashboardAppointment[];
};

export function AppointmentList({ appointments }: AppointmentListProps) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div>
          <h3 className="font-heading text-lg tracking-tight">
            Today&apos;s schedule
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Confirmed and completed appointments for today
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/appointments">
            View all
            <ArrowUpRight data-icon="inline-end" />
          </Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarDays className="size-5" />
          </span>
          <p className="mt-3 text-sm font-medium">No appointments today</p>
          <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
            New bookings will appear here as soon as they are confirmed.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
            >
              <div className="w-14 shrink-0">
                <p className="text-sm font-semibold tabular-nums">
                  {formatClinicTime(appointment.time)}
                </p>
                <p className="text-[0.65rem] text-muted-foreground">45 min</p>
              </div>

              <Avatar className="hidden size-9 sm:flex">
                <AvatarFallback className="bg-brand-soft text-[0.68rem] font-semibold text-brand">
                  {initials(appointment.patientName)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {appointment.patientName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-[0.68rem] text-muted-foreground">
                    {appointment.patientReference}
                  </span>
                  <BookingSourceLabel source={appointment.source} />
                  <AppointmentTypeBadge
                    type={appointment.type}
                    className="sm:hidden"
                  />
                </div>
              </div>

              <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
                <AppointmentStatusBadge status={appointment.status} />
                <AppointmentTypeBadge type={appointment.type} />
              </div>
              <AppointmentStatusBadge
                status={appointment.status}
                className="sm:hidden"
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border/70 bg-muted/25 px-5 py-2.5 text-[0.68rem] text-muted-foreground">
        Clinic local time · {appointments.length} appointment
        {appointments.length === 1 ? "" : "s"} shown
      </div>
    </Card>
  );
}
