import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Paperclip,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { PatientForm } from "./patient-form";
import { AttachmentForm } from "./attachment-form";
import { StatCard } from "@/components/dashboard/stat-card";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getPatients } from "@/lib/patients/data";
import { initials } from "@/lib/utils";

export const metadata: Metadata = { title: "Patients" };

export const instant = false;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireClinicUser();
  const params = await searchParams;
  const result = await getPatients(params?.q ?? "");

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const attachmentCount = result.attachments.length;
  const attachmentsByPatient = new Map<string, typeof result.attachments>();

  for (const attachment of result.attachments) {
    const list = attachmentsByPatient.get(attachment.patientId);

    if (list) {
      list.push(attachment);
    } else {
      attachmentsByPatient.set(attachment.patientId, [attachment]);
    }
  }

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Patients"
        description="Manage administrative patient details and private attachments. Clinical notes remain in consultation records."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/consultations">
              <CalendarDays data-icon="inline-start" />
              Consultations
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Patients"
          value={result.patients.length}
          helper={result.query ? "Matching search" : "Most recently added"}
          icon={Users}
        />
        <StatCard
          label="Attachments"
          value={attachmentCount}
          helper="Stored in the private patient-attachments bucket"
          icon={Paperclip}
        />
        <StatCard
          label="Visibility"
          value="Clinic only"
          helper="RLS and signed URLs protect clinical attachments"
          icon={ShieldCheck}
        />
      </div>

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-heading text-lg tracking-tight">Add a patient</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Administrative record only; clinical history is saved during consultations.
              </p>
            </div>
            <span className="text-xs text-brand">Open form</span>
          </summary>
          <div className="border-t border-border/70 px-5 py-5">
            <PatientForm />
          </div>
        </details>
      </Card>

      <Card className="gap-0 py-0 shadow-soft ring-border/80">
        <form
          method="get"
          action="/dashboard/patients"
          className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-1.5">
            <label htmlFor="q" className="text-sm font-medium">
              Search patients
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={result.query}
              placeholder="Name, reference or phone"
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search data-icon="inline-start" />
            Search
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/patients">Reset</Link>
          </Button>
        </form>

        {result.patients.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Users className="size-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">No patients found</p>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">
              Add the first patient, or clear the search to see every registered record.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/70">
            {result.patients.map((patient) => {
              const files = attachmentsByPatient.get(patient.id) ?? [];

              return (
                <li key={patient.id} className="px-5 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <Avatar className="size-11 shrink-0">
                      <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
                        {initials(patient.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{patient.fullName}</p>
                        <span className="font-mono text-xs text-muted-foreground">
                          {patient.reference}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{patient.phone}</span>
                        {patient.email && <span>{patient.email}</span>}
                        {patient.address && <span>{patient.address}</span>}
                      </div>
                      {patient.adminNotes && (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          Admin note: {patient.adminNotes}
                        </p>
                      )}

                      <div className="mt-3 rounded-xl border border-border/70 bg-muted/20 p-3">
                        <p className="text-xs font-medium">Private attachments</p>
                        {files.length === 0 ? (
                          <p className="mt-1 text-[0.68rem] text-muted-foreground">
                            No files attached.
                          </p>
                        ) : (
                          <ul className="mt-2 space-y-1.5">
                            {files.map((file) => (
                              <li
                                key={file.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-xs"
                              >
                                {file.signedUrl ? (
                                  <a
                                    href={file.signedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-brand underline-offset-2 hover:underline"
                                  >
                                    {file.fileName}
                                  </a>
                                ) : (
                                  <span>{file.fileName}</span>
                                )}
                                <span className="text-[0.65rem] text-muted-foreground">
                                  {Math.round(file.sizeBytes / 1024)} KB · {file.mimeType}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-3">
                          <AttachmentForm patientId={patient.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
