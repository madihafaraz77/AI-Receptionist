import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  Users,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { ManagedAppointmentList } from "@/components/dashboard/managed-appointment-list";
import { StatCard } from "@/components/dashboard/stat-card";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getDashboardAppointments } from "@/lib/dashboard/data";
import { addDaysToDateKey } from "@/lib/dashboard/date";
import type { AppointmentStatus } from "@/lib/dashboard/types";

export const metadata: Metadata = { title: "Appointments" };

// Appointment actions change live records on every request.
export const instant = false;

const dateLabel = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const selectClassName =
  "h-10 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const statusOptions: Array<{ label: string; value: AppointmentStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No show", value: "no_show" },
  { label: "Rescheduled", value: "rescheduled" },
];

function appointmentsHref(date: string, status: AppointmentStatus | "all") {
  const params = new URLSearchParams({ date, status });
  return `/dashboard/appointments?${params.toString()}`;
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    status?: string;
  }>;
}) {
  await requireClinicUser();
  const params = await searchParams;
  const result = await getDashboardAppointments({
    date: params?.date,
    status: params?.status,
  });

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const previousDate = addDaysToDateKey(result.selectedDate, -1);
  const nextDate = addDaysToDateKey(result.selectedDate, 1);
  const selectedDateLabel = dateLabel.format(
    new Date(`${result.selectedDate}T00:00:00Z`),
  );
  const activeCount = result.appointments.filter(
    (appointment) =>
      appointment.status === "pending" || appointment.status === "confirmed",
  ).length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Appointments"
        description="Review the live booking calendar, confirm requests, complete visits and cancel appointments. Every change is recorded."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={appointmentsHref(previousDate, result.statusFilter)}>
                <ChevronLeft data-icon="inline-start" />
                Previous
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={appointmentsHref(nextDate, result.statusFilter)}>
                Next
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        }
      />

      {!result.timezoneConfigured && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-600/20 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-amber-900">
          <Clock3 className="mt-0.5 size-4 shrink-0" />
          The clinic timezone is not configured, so dates and times are shown in
          UTC. Set it in Clinic Settings before relying on “today”.
        </p>
      )}

      <form
        method="get"
        action="/dashboard/appointments"
        className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-soft sm:flex-row sm:items-end"
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <label htmlFor="date" className="text-sm font-medium">
            Appointment date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            defaultValue={result.selectedDate}
            className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>

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
          Apply filters
        </Button>

        <Button variant="ghost" asChild>
          <Link href="/dashboard/appointments">Reset</Link>
        </Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Appointments shown"
          value={result.appointments.length}
          helper={`${activeCount} pending or confirmed in this view`}
          icon={CalendarDays}
        />
        <StatCard
          label="Capacity used"
          value={`${result.capacityUsed}/${result.capacityTotal}`}
          helper="Pending, confirmed and completed appointments count towards the day"
          icon={Users}
        />
        <StatCard
          label="View"
          value={
            result.statusFilter === "all"
              ? "All"
              : result.statusFilter.charAt(0).toUpperCase() +
                result.statusFilter.slice(1)
          }
          helper={`Filtered to ${selectedDateLabel}`}
          icon={CheckCircle2}
        />
      </div>

      <ManagedAppointmentList
        appointments={result.appointments}
        selectedDateLabel={selectedDateLabel}
      />

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-lg tracking-tight">
            What the actions do
          </h2>
        </div>
        <ul className="grid gap-3 px-5 py-5 text-sm leading-6 text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="font-medium text-foreground">Confirm</span> — a pending
            booking becomes confirmed; patients who chose manual approval are ready
            for the clinic.
          </li>
          <li>
            <span className="font-medium text-foreground">Complete</span> — marks a
            pending or confirmed visit as completed; capacity remains counted.
          </li>
          <li>
            <span className="font-medium text-foreground">Cancel</span> — removes a
            pending or confirmed booking from capacity and requires a reason in the
            audit log.
          </li>
        </ul>
      </Card>
    </div>
  );
}
