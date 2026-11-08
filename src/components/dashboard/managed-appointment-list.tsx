import { CalendarDays, Globe2, MapPin, Video } from "lucide-react";

import { AppointmentStatusControls } from "@/components/dashboard/appointment-status-controls";
import {
  AppointmentStatusBadge,
  AppointmentTypeBadge,
  BookingSourceLabel,
} from "@/components/dashboard/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatClinicTime, formatPkr } from "@/config/clinic";
import type { ManagedAppointment } from "@/lib/dashboard/types";
import { initials } from "@/lib/utils";

export function ManagedAppointmentList({
  appointments,
  selectedDateLabel,
}: {
  appointments: ManagedAppointment[];
  selectedDateLabel: string;
}) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div>
          <h2 className="font-heading text-lg tracking-tight">
            Appointments — {selectedDateLabel}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every action updates the appointment event history and audit log.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5">
          <CalendarDays className="size-3" />
          {appointments.length} showing
        </Badge>
      </div>

      {appointments.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <CalendarDays className="size-5" />
          </span>
          <p className="mt-4 text-sm font-medium">No appointments match this view</p>
          <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
            Choose another date or status filter. Cancelled appointments release
            their capacity; future pending requests appear automatically.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/70">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="bg-card transition-colors hover:bg-muted/15"
            >
              <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 md:flex-row md:items-start">
                <div className="w-20 shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatClinicTime(appointment.time)}
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    To {formatClinicTime(appointment.endTime)}
                  </p>
                  <Badge variant="outline" className="mt-2 px-1.5 py-0 text-[0.62rem] font-normal">
                    {appointment.type === "online" ? (
                      <Video className="size-2.5" />
                    ) : (
                      <MapPin className="size-2.5" />
                    )}
                    {formatPkr(appointment.feePkr)}
                  </Badge>
                </div>

                <Avatar className="hidden size-10 md:flex">
                  <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
                    {initials(appointment.patientName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">
                      {appointment.patientName}
                    </p>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[0.68rem] text-muted-foreground">
                      {appointment.patientReference}
                    </span>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {appointment.patientPhone}
                    </span>
                    <BookingSourceLabel source={appointment.source} />
                    <AppointmentTypeBadge type={appointment.type} />
                  </div>

                  {appointment.serviceName && (
                    <p className="mt-2 text-xs font-medium">
                      {appointment.serviceName}
                    </p>
                  )}

                  {appointment.notes && (
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">
                      “{appointment.notes}”
                    </p>
                  )}
                </div>
              </div>

              <AppointmentStatusControls
                appointmentId={appointment.id}
                status={appointment.status}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border/70 bg-muted/25 px-5 py-2.5 text-[0.68rem] text-muted-foreground">
        <Globe2 className="mr-1 inline size-3 align-[-2px]" />
        Status changes are recorded in appointment events. No patient data is
        sent outside the clinic application.
      </div>
    </Card>
  );
}
