"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { createPatientAction } from "./actions";
import { initialPatientActionState } from "./action-state";

export function PatientForm() {
  const [state, formAction, isPending] = useActionState(
    createPatientAction,
    initialPatientActionState,
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" required autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" type="tel" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optional)</Label>
            <Input id="email" name="email" type="email" autoComplete="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Date of birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender / identity (optional)</Label>
            <Input id="gender" name="gender" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" name="address" rows={2} maxLength={300} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="adminNotes">Non-clinical notes</Label>
            <Textarea
              id="adminNotes"
              name="adminNotes"
              rows={2}
              maxLength={500}
              placeholder="How this patient prefers to be contacted; never diagnoses."
            />
          </div>
        </div>
      </fieldset>
      <div className="flex justify-end">
        <Button disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle
                className="animate-spin"
                data-icon="inline-start"
              />
              Adding patient…
            </>
          ) : (
            <>
              <Save data-icon="inline-start" />
              Add patient
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
