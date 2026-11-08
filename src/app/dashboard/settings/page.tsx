import type { Metadata } from "next";
import { Bell, Bot, Mail, MessageCircle, Pencil, ShieldCheck } from "lucide-react";

import { DatabaseSetupNotice, DataErrorNotice } from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getDashboardClinicSettings } from "@/lib/clinic/data";

import { ClinicSettingsForm, ClinicSettingsReadOnly } from "./settings-form";

export const metadata: Metadata = { title: "Clinic Settings" };

export default async function SettingsPage() {
  const user = await requireClinicUser();
  const result = await getDashboardClinicSettings();

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

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Clinic settings"
        description={
          canEdit
            ? "The live configuration for Nissa. These values are the source of truth for the public website and booking rules."
            : "The live configuration for Nissa. Only the doctor account can change it."
        }
        actions={
          <Badge variant="outline" className="gap-1.5">
            {canEdit ? <Pencil className="size-3" /> : <ShieldCheck className="size-3" />}
            {canEdit ? "Editable · Doctor only" : "Read-only · Staff"}
          </Badge>
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-brand/15 bg-brand-soft/50 p-4">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-medium">Saved to Supabase with a full audit trail</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Settings are validated on the server and written through Row Level
            Security. Every save records who changed what. Missing details stay
            blank instead of being invented.
          </p>
        </div>
      </div>

      {canEdit ? (
        <ClinicSettingsForm settings={result.settings} />
      ) : (
        <ClinicSettingsReadOnly settings={result.settings} />
      )}

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <div className="border-b border-border/70 px-5 py-4">
          <h3 className="font-heading text-lg tracking-tight">
            Provider connection status
          </h3>
          <p className="text-xs text-muted-foreground">
            External services are shown as not connected until credentials are
            configured and tested.
          </p>
        </div>
        <ul className="divide-y divide-border/70">
          {[
            {
              icon: Bell,
              label: "Dashboard notifications",
              status: "Available in dashboard",
              ok: true,
            },
            {
              icon: Mail,
              label: "Email (Resend)",
              status: "Not configured",
              ok: false,
            },
            {
              icon: MessageCircle,
              label: "WhatsApp Business",
              status: "Not configured",
              ok: false,
            },
            {
              icon: Bot,
              label: "AI provider",
              status: "Not configured",
              ok: false,
            },
          ].map((provider) => {
            const ProviderIcon = provider.icon;

            return (
              <li
                key={provider.label}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm">
                  <ProviderIcon className="size-4 text-muted-foreground" />
                  {provider.label}
                </span>
                <span
                  className={
                    provider.ok
                      ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-700"
                      : "rounded-full bg-amber-50 px-2 py-0.5 text-[0.65rem] font-medium text-amber-700"
                  }
                >
                  {provider.status}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
