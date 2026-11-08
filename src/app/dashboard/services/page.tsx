import type { Metadata } from "next";
import {
  ChevronDown,
  Globe,
  Pencil,
  Plus,
  Stethoscope,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPkr } from "@/config/clinic";
import { requireClinicUser } from "@/lib/auth/session";
import { getDashboardServices } from "@/lib/clinic/data";
import type { ClinicServiceRecord } from "@/lib/clinic/types";

import { ServiceForm } from "./service-form";

export const metadata: Metadata = { title: "Services" };

function ServiceSummary({ service }: { service: ClinicServiceRecord }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="truncate font-heading text-lg tracking-tight">
          {service.name}
        </h3>
        <Badge variant="outline" className="gap-1">
          <Globe className="size-3" />
          {service.mode === "online" ? "Online" : "In person"}
        </Badge>
        {service.isActive ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700">
            Published
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
            Archived
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {service.durationMinutes} min · {formatPkr(service.feePkr)} ·{" "}
        <span className="font-mono text-[0.68rem]">{service.slug}</span>
      </p>
    </div>
  );
}

export default async function ServicesPage() {
  const user = await requireClinicUser();
  const result = await getDashboardServices();

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
  const services = result.services;
  const published = services.filter((service) => service.isActive).length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Services"
        description="The catalogue shown on the public website and used when booking."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <Stethoscope className="size-3" />
            {published} published
            {services.length > published
              ? ` · ${services.length - published} archived`
              : ""}
          </Badge>
        }
      />

      {!canEdit && (
        <p className="rounded-xl border border-amber-600/20 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          You can review the published catalogue. Only the doctor account can
          add or change services.
        </p>
      )}

      {canEdit && (
        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="flex items-center gap-2 font-heading text-lg tracking-tight">
                  <Plus className="size-4 text-brand" />
                  Add a service
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  New services appear publicly as soon as they are saved.
                </p>
              </div>
              <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-border/70 px-5 py-5">
              <ServiceForm mode="create" />
            </div>
          </details>
        </Card>
      )}

      {services.length === 0 ? (
        <Card className="gap-0 py-10 text-center shadow-soft ring-border/80">
          <Stethoscope className="mx-auto size-6 text-muted-foreground" />
          <h3 className="mt-3 font-heading text-xl tracking-tight">
            No services yet
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Add the first consultation service. Until then, the public services
            page shows an honest empty state.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {services.map((service) =>
            canEdit ? (
              <Card
                key={service.id}
                className="gap-0 py-0 shadow-soft ring-border/80"
              >
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
                    <ServiceSummary service={service} />
                    <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      <Pencil className="size-3.5" />
                      Edit
                      <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  <div className="border-t border-border/70 px-5 py-5">
                    <ServiceForm mode="edit" service={service} />
                  </div>
                </details>
              </Card>
            ) : (
              <Card
                key={service.id}
                className="gap-0 py-0 shadow-soft ring-border/80"
              >
                <div className="px-5 py-4">
                  <ServiceSummary service={service} />
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </Card>
            ),
          )}
        </div>
      )}

      <p className="pb-2 text-center text-[0.68rem] text-muted-foreground">
        Saved services are used by the public website immediately. Booking rules
        are still enforced in the database.
      </p>
    </div>
  );
}
