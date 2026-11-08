import Link from "next/link";
import { ArrowLeft, Check, Clock3, type LucideIcon } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ModulePlaceholderProps = {
  title: string;
  description: string;
  milestone: number;
  icon: LucideIcon;
  features: string[];
};

export function ModulePlaceholder({
  title,
  description,
  milestone,
  icon: Icon,
  features,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title={title}
        description={description}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Clock3 className="size-3" />
            Planned for Milestone {milestone}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <div className="p-6 sm:p-8">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
              <Icon className="size-6" />
            </span>
            <h3 className="mt-5 font-heading text-2xl tracking-tight">
              This module is not built yet.
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              The dashboard shell is ready, but this screen is intentionally a
              placeholder. It will be implemented in Milestone {milestone} and
              connected to real Supabase data. No sample records are shown here.
            </p>

            <div className="mt-6 rounded-2xl border border-border/70 bg-muted/35 p-4">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Planned capabilities
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-brand ring-1 ring-border">
                      <Check className="size-3" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard">
                  <ArrowLeft data-icon="inline-start" />
                  Back to overview
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">View public website</Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <div className="border-b border-border/70 px-5 py-4">
            <h3 className="font-heading text-lg tracking-tight">
              Build sequence
            </h3>
            <p className="text-xs text-muted-foreground">
              This app is delivered one milestone at a time.
            </p>
          </div>
          <ol className="space-y-0 p-5">
            {[
              { label: "Project foundation", milestone: 1, done: true },
              { label: "Supabase & authentication", milestone: 2 },
              { label: "Clinic settings & services", milestone: 3 },
              { label: "Appointment booking", milestone: 4 },
              { label: "Doctor dashboard data", milestone: 5 },
              { label: "Patients & consultations", milestone: 6 },
              { label: "AI receptionist", milestone: 7 },
              { label: "AI booking & handover", milestone: 8 },
              { label: "Notifications & reminders", milestone: 9 },
              { label: "Testing & deployment", milestone: 10 },
            ].map((step) => (
              <li key={step.milestone} className="flex items-center gap-3 py-1.5">
                <span
                  className={
                    step.done
                      ? "flex size-5 items-center justify-center rounded-full bg-brand text-primary-foreground"
                      : step.milestone === milestone
                        ? "flex size-5 items-center justify-center rounded-full border border-brand/30 bg-brand-soft text-[0.6rem] font-semibold text-brand"
                        : "flex size-5 items-center justify-center rounded-full border border-border text-[0.6rem] text-muted-foreground"
                  }
                >
                  {step.done ? <Check className="size-3" /> : step.milestone}
                </span>
                <span
                  className={
                    step.milestone === milestone
                      ? "text-xs font-medium text-foreground"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
