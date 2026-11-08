"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClinicServiceRecord } from "@/lib/clinic/types";

import {
  createServiceAction,
  updateServiceAction,
} from "./actions";
import {
  initialServiceState,
  type ServiceActionState,
} from "./action-state";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[0.7rem] text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[0.68rem] leading-4 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type ServiceFormProps =
  | { mode: "create"; service?: undefined }
  | { mode: "edit"; service: ClinicServiceRecord };

export function ServiceForm(props: ServiceFormProps) {
  const isEdit = props.mode === "edit";
  const service = props.service;
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<
    ServiceActionState,
    FormData
  >(
    isEdit ? updateServiceAction : createServiceAction,
    initialServiceState,
  );

  useEffect(() => {
    if (!isEdit && state.status === "success") {
      formRef.current?.reset();
    }
  }, [isEdit, state.status]);

  const errors = state.errors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {props.mode === "edit" && (
        <input type="hidden" name="id" value={props.service.id} />
      )}

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

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="name" label="Service name" error={errors.name}>
            <Input
              id="name"
              name="name"
              defaultValue={service?.name ?? ""}
              required
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </Field>

          <Field
            id="slug"
            label="Slug"
            error={errors.slug}
            hint="Lowercase words separated by hyphens. Used in links and the database."
          >
            <Input
              id="slug"
              name="slug"
              defaultValue={service?.slug ?? ""}
              placeholder="follow-up-consultation"
              required
              aria-invalid={errors.slug ? true : undefined}
              aria-describedby={errors.slug ? "slug-error" : undefined}
            />
          </Field>
        </div>

        <Field
          id="description"
          label="Description"
          error={errors.description}
          hint="Factual, non-clinical wording. Do not promise cures or outcomes."
        >
          <Textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={service?.description ?? ""}
            required
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={
              errors.description ? "description-error" : undefined
            }
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            id="durationMinutes"
            label="Duration (minutes)"
            error={errors.durationMinutes}
          >
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min="5"
              max="240"
              defaultValue={String(service?.durationMinutes ?? 45)}
              required
              aria-invalid={errors.durationMinutes ? true : undefined}
              aria-describedby={
                errors.durationMinutes ? "durationMinutes-error" : undefined
              }
            />
          </Field>

          <Field id="feePkr" label="Fee (PKR)" error={errors.feePkr}>
            <Input
              id="feePkr"
              name="feePkr"
              type="number"
              min="0"
              max="1000000"
              defaultValue={String(service?.feePkr ?? 500)}
              required
              aria-invalid={errors.feePkr ? true : undefined}
              aria-describedby={errors.feePkr ? "feePkr-error" : undefined}
            />
          </Field>

          <Field id="sortOrder" label="Sort order" error={errors.sortOrder}>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min="0"
              max="999"
              defaultValue={String(service?.sortOrder ?? 0)}
              required
              aria-invalid={errors.sortOrder ? true : undefined}
              aria-describedby={
                errors.sortOrder ? "sortOrder-error" : undefined
              }
            />
          </Field>

          <Field id="mode" label="Consultation mode" error={errors.mode}>
            <select
              id="mode"
              name="mode"
              defaultValue={service?.mode ?? "in_person"}
              className={selectClassName}
              aria-invalid={errors.mode ? true : undefined}
            >
              <option value="in_person">In person</option>
              <option value="online">Online</option>
            </select>
          </Field>
        </div>

        <label
          htmlFor="isActive"
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
        >
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            defaultChecked={service?.isActive ?? true}
            className="mt-0.5 size-4 shrink-0 accent-brand"
          />
          <span>
            <span className="block font-medium">Visible on the public website</span>
            <span className="mt-0.5 block text-[0.68rem] leading-4 text-muted-foreground">
              Turn this off to archive the service. Existing appointments keep
              their records.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
              Saving…
            </>
          ) : (
            <>
              <Save data-icon="inline-start" />
              {isEdit ? "Save service" : "Add service"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
