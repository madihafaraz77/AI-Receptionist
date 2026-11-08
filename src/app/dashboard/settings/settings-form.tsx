"use client";

import { useActionState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Save,
  Stethoscope,
  Building2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatClinicTime,
  formatPkr,
  WEEKDAYS,
} from "@/config/clinic";
import type { ClinicSettings } from "@/lib/clinic/types";

import { updateClinicSettingsAction } from "./actions";
import {
  initialSettingsState,
  type SettingsActionState,
} from "./action-state";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

function formatUpdatedAt(value: string | null, timezone: string | null): string {
  if (!value) return "Not saved from the dashboard yet";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone ?? "UTC",
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value));
  }
}

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ id, label, error, hint, children }: FieldProps) {
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

type TextFieldProps = {
  id: string;
  name?: string;
  label: string;
  defaultValue: string | null;
  error?: string;
  hint?: string;
  type?: string;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  step?: string;
  min?: string;
  max?: string;
  required?: boolean;
};

function TextField({
  id,
  name = id,
  label,
  defaultValue,
  error,
  hint,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
  step,
  min,
  max,
  required,
}: TextFieldProps) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <Input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        step={step}
        min={min}
        max={max}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
    </Field>
  );
}

function CheckboxField({
  id,
  name = id,
  label,
  description,
  defaultChecked,
}: {
  id: string;
  name?: string;
  label: string;
  description?: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
    >
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-brand"
      />
      <span>
        <span className="block font-medium">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[0.68rem] leading-4 text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Building2;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex items-start gap-3 border-b border-border/70 px-5 py-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h3 className="font-heading text-lg tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </Card>
  );
}

export function ClinicSettingsForm({ settings }: { settings: ClinicSettings }) {
  const [state, formAction, isPending] = useActionState<
    SettingsActionState,
    FormData
  >(updateClinicSettingsAction, initialSettingsState);

  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      {state.status === "success" && state.message && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {state.message}
        </p>
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <FormSection
          title="Clinic information"
          description="Only publish details the clinic owner has confirmed."
          icon={Building2}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="name"
              label="Clinic name"
              defaultValue={settings.name}
              error={errors.name}
              required
            />
            <TextField
              id="doctorName"
              label="Doctor name"
              defaultValue={settings.doctorName}
              error={errors.doctorName}
              hint="Leave blank until the doctor approves publishing it."
            />
            <TextField
              id="phone"
              label="Phone number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={settings.phone}
              error={errors.phone}
              placeholder="+92 300 0000000"
            />
            <TextField
              id="email"
              label="Email address"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={settings.email}
              error={errors.email}
              placeholder="clinic@example.com"
            />
            <TextField
              id="timezone"
              label="Timezone"
              defaultValue={settings.timezone}
              error={errors.timezone}
              hint="IANA name, for example Asia/Karachi. Leave blank only if the clinic has not chosen one."
            />
            <div className="sm:col-span-2">
              <Field
                id="address"
                label="Address"
                error={errors.address}
                hint="Shown on the public contact page once supplied."
              >
                <Textarea
                  id="address"
                  name="address"
                  rows={2}
                  defaultValue={settings.address ?? ""}
                  aria-invalid={errors.address ? true : undefined}
                  aria-describedby={
                    errors.address ? "address-error" : undefined
                  }
                />
              </Field>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Schedule & capacity"
          description="These values control booking validation in the database."
          icon={Clock3}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField
              id="openingTime"
              label="Opening time"
              type="time"
              step="300"
              defaultValue={settings.openingTime}
              error={errors.openingTime}
              required
            />
            <TextField
              id="closingTime"
              label="Closing time"
              type="time"
              step="300"
              defaultValue={settings.closingTime}
              error={errors.closingTime}
              required
            />
            <TextField
              id="appointmentDurationMinutes"
              label="Appointment length"
              type="number"
              min="5"
              max="240"
              defaultValue={String(settings.appointmentDurationMinutes)}
              error={errors.appointmentDurationMinutes}
              hint="Minutes per appointment."
              required
            />
            <TextField
              id="dailyCapacity"
              label="Daily capacity"
              type="number"
              min="1"
              max="100"
              defaultValue={String(settings.dailyCapacity)}
              error={errors.dailyCapacity}
              hint="Maximum active appointments per day."
              required
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Working days</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {WEEKDAYS.map((day) => (
                <label
                  key={day.value}
                  htmlFor={`weekday-${day.value}`}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm transition-colors hover:bg-muted/40"
                >
                  <input
                    id={`weekday-${day.value}`}
                    name="workingWeekdays"
                    type="checkbox"
                    value={day.value}
                    defaultChecked={settings.workingWeekdays.includes(day.value)}
                    className="size-4 accent-brand"
                  />
                  {day.short}
                </label>
              ))}
            </div>
            {errors.workingWeekdays && (
              <p className="text-[0.7rem] text-destructive">
                {errors.workingWeekdays}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="bookingApproval" label="Booking approval">
              <select
                id="bookingApproval"
                name="bookingApproval"
                defaultValue={settings.bookingApproval}
                aria-invalid={errors.bookingApproval ? true : undefined}
                className={selectClassName}
              >
                <option value="automatic">
                  Automatic — confirmed immediately
                </option>
                <option value="manual">Manual — doctor approves</option>
              </select>
              {errors.bookingApproval && (
                <p className="text-[0.7rem] text-destructive">
                  {errors.bookingApproval}
                </p>
              )}
            </Field>

            <CheckboxField
              id="walkInsEnabled"
              label="Walk-ins accepted"
              description="Leave off if patients should book ahead."
              defaultChecked={settings.walkInsEnabled}
            />
          </div>
        </FormSection>

        <FormSection
          title="Consultations & fees"
          description="Public fee and consultation defaults."
          icon={Stethoscope}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="consultationFeePkr"
              label="Consultation fee (PKR)"
              type="number"
              min="0"
              max="1000000"
              defaultValue={String(settings.consultationFeePkr)}
              error={errors.consultationFeePkr}
              hint={`Currently shown as ${formatPkr(settings.consultationFeePkr)}.`}
              required
            />
            <TextField
              id="followUpReminderHours"
              label="Follow-up reminder (hours before)"
              type="number"
              min="1"
              max="720"
              defaultValue={String(settings.followUpReminderHours)}
              error={errors.followUpReminderHours}
              hint="Used when reminders are implemented."
              required
            />
          </div>

          <CheckboxField
            id="onlineConsultationEnabled"
            label="Online consultations available"
            description="Controls whether online booking is offered."
            defaultChecked={settings.onlineConsultationEnabled}
          />

          <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-[0.7rem] leading-5 text-muted-foreground">
            Prescriptions, clinical records and consultation notes can only be
            written by the doctor account. This setting does not change that
            rule.
          </div>
        </FormSection>
      </fieldset>

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.7rem] text-muted-foreground">
          Last saved: {formatUpdatedAt(settings.updatedAt, settings.timezone)}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex">
            {formatClinicTime(settings.openingTime)} –{" "}
            {formatClinicTime(settings.closingTime)}
          </Badge>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
                Saving…
              </>
            ) : (
              <>
                <Save data-icon="inline-start" />
                Save settings
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ReadOnlyRow({
  label,
  value,
  missing = false,
}: {
  label: string;
  value: string;
  missing?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          missing
            ? "text-right text-xs font-medium text-amber-700"
            : "text-right font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Staff see the same confirmed values without edit controls. RLS also blocks
 * staff writes, so this is not the only protection.
 */
export function ClinicSettingsReadOnly({
  settings,
}: {
  settings: ClinicSettings;
}) {
  const workingDays = WEEKDAYS.filter((day) =>
    settings.workingWeekdays.includes(day.value),
  )
    .map((day) => day.short)
    .join(", ");

  const notWorkingDays = WEEKDAYS.filter(
    (day) => !settings.workingWeekdays.includes(day.value),
  )
    .map((day) => day.short)
    .join(", ");

  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-amber-600/20 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
        You can review clinic settings, but only the doctor account can change
        them.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <div className="border-b border-border/70 px-5 py-4">
            <h3 className="font-heading text-lg tracking-tight">
              Clinic information
            </h3>
          </div>
          <div className="divide-y divide-border/60 px-5 py-1">
            <ReadOnlyRow label="Clinic name" value={settings.name} />
            <ReadOnlyRow
              label="Doctor name"
              value={settings.doctorName ?? "Not supplied yet"}
              missing={!settings.doctorName}
            />
            <ReadOnlyRow
              label="Phone"
              value={settings.phone ?? "Not supplied yet"}
              missing={!settings.phone}
            />
            <ReadOnlyRow
              label="Email"
              value={settings.email ?? "Not supplied yet"}
              missing={!settings.email}
            />
            <ReadOnlyRow
              label="Address"
              value={settings.address ?? "Not supplied yet"}
              missing={!settings.address}
            />
            <ReadOnlyRow
              label="Timezone"
              value={settings.timezone ?? "Not configured yet"}
              missing={!settings.timezone}
            />
          </div>
        </Card>

        <Card className="gap-0 py-0 shadow-soft ring-border/80">
          <div className="border-b border-border/70 px-5 py-4">
            <h3 className="font-heading text-lg tracking-tight">
              Schedule & capacity
            </h3>
          </div>
          <div className="divide-y divide-border/60 px-5 py-1">
            <ReadOnlyRow
              label="Clinic hours"
              value={`${formatClinicTime(settings.openingTime)} – ${formatClinicTime(settings.closingTime)}`}
            />
            <ReadOnlyRow
              label="Appointment length"
              value={`${settings.appointmentDurationMinutes} minutes`}
            />
            <ReadOnlyRow
              label="Daily capacity"
              value={`${settings.dailyCapacity} patients`}
            />
            <ReadOnlyRow label="Working days" value={workingDays} />
            <ReadOnlyRow
              label="Closed"
              value={notWorkingDays || "None"}
              missing={Boolean(notWorkingDays)}
            />
            <ReadOnlyRow
              label="Booking approval"
              value={
                settings.bookingApproval === "automatic"
                  ? "Automatic"
                  : "Manual"
              }
            />
            <ReadOnlyRow
              label="Walk-ins"
              value={settings.walkInsEnabled ? "Enabled" : "Disabled"}
            />
            <ReadOnlyRow
              label="Consultation fee"
              value={formatPkr(settings.consultationFeePkr)}
            />
            <ReadOnlyRow
              label="Online consultations"
              value={
                settings.onlineConsultationEnabled ? "Enabled" : "Disabled"
              }
            />
          </div>
        </Card>
      </div>

      <p className="text-center text-[0.68rem] text-muted-foreground">
        Last saved: {formatUpdatedAt(settings.updatedAt, settings.timezone)}
      </p>
    </div>
  );
}
