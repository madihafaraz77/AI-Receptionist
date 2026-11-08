import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { ConsultationForm } from "./consultation-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getConsultationsData } from "@/lib/consultations/data";

export const metadata: Metadata = { title: "Consultations" };

export const instant = false;

export default async function ConsultationsPage() {
  const user = await requireClinicUser();
  const result = await getConsultationsData();

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const canWrite = user.role === "doctor";
  const withPlan = result.consultations.filter((row) => row.plan).length;
  const withPrescription = result.consultations.filter(
    (row) => row.prescriptionId,
  ).length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Consultations"
        description="Private clinical records, prescriptions and follow-up scheduling. Doctor-only."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/follow-ups">Follow-ups</Link>
          </Button>
        }
      />

      {!canWrite && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-600/20 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          Clinical records and prescriptions are doctor-only. Staff can review
          booking and follow-up status but not create or edit clinical notes.
        </p>
      )}

      {canWrite && (
        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 outline-none">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="font-heading text-lg tracking-tight">Record a consultation</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    The prescription and follow-up are optional; clinical notes are written by the doctor.
                  </p>
                </div>
              </div>
              <span className="text-xs text-brand">Open form</span>
            </summary>
            <div className="border-t border-border/70 px-5 py-5">
              <ConsultationForm eligibleAppointments={result.eligibleAppointments} />
            </div>
          </details>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Consultations"
          value={result.consultations.length}
          helper="Records available to the doctor"
          icon={Stethoscope}
        />
        <StatCard
          label="With a plan"
          value={withPlan}
          helper="Consultations with a written next step"
          icon={CalendarDays}
        />
        <StatCard
          label="Prescriptions"
          value={withPrescription}
          helper="Consultations linked to a prescription"
          icon={ShieldCheck}
        />
      </div>

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <div className="border-b border-border/70 px-5 py-4">
          <h2 className="font-heading text-lg tracking-tight">History</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Private to the doctor account. Never expose clinical details to
            public booking pages.
          </p>
        </div>

        {result.consultations.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Stethoscope className="size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No consultations yet</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Confirmed appointments appear in the creation form and records are
              saved after each visit.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {result.consultations.map((consultation) => (
              <li key={consultation.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{consultation.patientName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {consultation.consultedAtLabel} · {consultation.patientReference}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {consultation.prescriptionId && (
                      <Badge variant="outline">Prescription</Badge>
                    )}
                    {consultation.followUpId && (
                      <Badge variant="outline">Follow-up</Badge>
                    )}
                  </div>
                </div>

                <dl className="mt-3 grid gap-2 text-xs leading-5 text-muted-foreground md:grid-cols-2">
                  {consultation.chiefComplaint && (
                    <div><dt className="font-medium text-foreground">Complaint</dt><dd>{consultation.chiefComplaint}</dd></div>
                  )}
                  {consultation.examination && (
                    <div><dt className="font-medium text-foreground">Examination</dt><dd>{consultation.examination}</dd></div>
                  )}
                  {consultation.assessment && (
                    <div><dt className="font-medium text-foreground">Assessment</dt><dd>{consultation.assessment}</dd></div>
                  )}
                  {consultation.plan && (
                    <div><dt className="font-medium text-foreground">Plan</dt><dd>{consultation.plan}</dd></div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
