import Link from "next/link";
import {
  CalendarClock,
  CalendarDays,
  Plus,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

import { AppointmentList } from "@/components/dashboard/appointment-list";
import {
  AiAttentionCard,
  NotificationsCard,
} from "@/components/dashboard/attention-cards";
import { CapacityCard } from "@/components/dashboard/capacity-card";
import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { FollowUpList } from "@/components/dashboard/follow-up-list";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { QuickActionsCard } from "@/components/dashboard/quick-actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Button } from "@/components/ui/button";
import { getDashboardOverview } from "@/lib/dashboard/data";

// The overview reads live clinic data on every request.
export const instant = false;

export default async function DashboardOverviewPage() {
  const data = await getDashboardOverview();

  if (data.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (data.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (data.status === "error") {
    return <DataErrorNotice />;
  }

  const onlineToday = data.appointments.filter(
    (appointment) => appointment.type === "online",
  ).length;
  const inPersonToday = data.appointments.length - onlineToday;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Clinic overview"
        description="A calm view of today at Nissa Homeopathic Clinic."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/ai-receptionist">
                <Sparkles data-icon="inline-start" />
                AI inbox
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/appointments">
                <Plus data-icon="inline-start" />
                New appointment
              </Link>
            </Button>
          </>
        }
      />

      {!data.timezoneConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-600/20 bg-amber-50/80 p-4">
          <CalendarClock className="mt-0.5 size-4 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Clinic timezone not configured
            </p>
            <p className="mt-0.5 text-xs leading-5 text-amber-900/70">
              Dates and times use UTC until the owner sets a timezone in Clinic
              Settings (Milestone 3). No timezone has been assumed.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's appointments"
          value={data.stats.todayAppointments}
          helper={`${inPersonToday} in person · ${onlineToday} online`}
          icon={CalendarDays}
        />
        <StatCard
          label="Upcoming appointments"
          value={data.stats.upcomingAppointments}
          helper="Next 7 days"
          icon={CalendarClock}
        />
        <StatCard
          label="Registered patients"
          value={data.stats.registeredPatients}
          helper="Total patient profiles"
          icon={Users}
        />
        <StatCard
          label="Completed consultations"
          value={data.stats.completedConsultations}
          helper="All time"
          icon={Stethoscope}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <AppointmentList appointments={data.appointments} />
        </div>
        <div className="space-y-4">
          <CapacityCard
            used={data.stats.capacityUsed}
            total={data.stats.capacityTotal}
            durationMinutes={data.appointmentDurationMinutes}
          />
          <QuickActionsCard />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FollowUpList followUps={data.followUps} />
        <AiAttentionCard
          conversations={data.conversations}
          pendingFeedback={data.stats.pendingFeedback}
        />
        <NotificationsCard notifications={data.notifications} />
      </div>

      <p className="pb-2 text-center text-[0.68rem] text-muted-foreground">
        Live data from Supabase · times shown in {data.timezone}
        {data.timezoneConfigured ? "" : " (fallback)"}
      </p>
    </div>
  );
}
