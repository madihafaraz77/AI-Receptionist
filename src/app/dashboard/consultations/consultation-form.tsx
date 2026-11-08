"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ConsultationEligibleAppointment } from "@/lib/consultations/types";

import { createConsultationAction } from "./actions";
import { initialConsultationActionState } from "./action-state";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ConsultationForm({
  eligibleAppointments,
}: {
  eligibleAppointments: ConsultationEligibleAppointment[];
}) {
  const [state, formAction, isPending] = useActionState(
    createConsultationAction,
    initialConsultationActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      )}

      {state.status === "success" && state.message && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-600/20 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      )}

      <fieldset disabled={isPending} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="appointmentId">Appointment</Label>
          <select id="appointmentId" name="appointmentId" required className={selectClassName}>
            <option value="">Choose an appointment…</option>
            {eligibleAppointments.map((appointment) => (
              <option key={appointment.id} value={appointment.id}>
                {appointment.reference} — {appointment.patientName} ·{" "}
                {appointment.date} {appointment.startTime}
                {appointment.serviceName ? ` · ${appointment.serviceName}` : ""}
              </option>
            ))}
          </select>
          {eligibleAppointments.length === 0 && (
            <p className="text-[0.68rem] text-muted-foreground">
              No confirmed or completed appointments are available to document yet.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="chiefComplaint">Chief complaint / reason</Label>
            <Textarea id="chiefComplaint" name="chiefComplaint" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="history">History</Label>
            <Textarea id="history" name="history" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="examination">Examination</Label>
            <Textarea id="examination" name="examination" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assessment">Assessment</Label>
            <Textarea id="assessment" name="assessment" rows={3} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="plan">Plan</Label>
            <Textarea id="plan" name="plan" rows={3} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="privateNotes">Private notes</Label>
            <Textarea
              id="privateNotes"
              name="privateNotes"
              rows={3}
              placeholder="Doctor-only context. Keep it factual."
            />
          </div>
        </div>

        <fieldset className="space-y-4 rounded-xl border border-border/70 p-4">
          <legend className="px-1 text-sm font-semibold">
            Optional prescription and follow-up
          </legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="remedyName">Remedy / medicine</Label>
              <Input id="remedyName" name="remedyName" maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="potency">Potency</Label>
              <Input id="potency" name="potency" maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input id="durationDays" name="durationDays" type="number" min="1" max="365" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dosage">Dosage</Label>
              <Input id="dosage" name="dosage" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="frequency">Frequency</Label>
              <Input id="frequency" name="frequency" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="followUpDate">Follow-up date</Label>
              <Input id="followUpDate" name="followUpDate" type="date" />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea id="instructions" name="instructions" rows={2} maxLength={1000} />
            </div>
          </div>
        </fieldset>
      </fieldset>

      <div className="flex justify-end">
        <Button disabled={isPending || eligibleAppointments.length === 0}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
              Saving consultation…
            </>
          ) : (
            <>
              <Save data-icon="inline-start" />
              Save consultation
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
