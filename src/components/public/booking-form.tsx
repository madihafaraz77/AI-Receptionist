"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  formatClinicTime,
  formatPkr,
  type ClinicService,
} from "@/config/clinic";

import {
  createBookingAction,
  findAvailableSlotsAction,
} from "@/app/(public)/book/actions";
import {
  initialBookingState,
  initialSlotState,
} from "@/app/(public)/book/action-state";

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

export function BookingForm({
  services,
  bookingApproval,
}: {
  services: ClinicService[];
  bookingApproval: "automatic" | "manual";
}) {
  const [serviceId, setServiceId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [slotState, slotAction, findingSlots] = useActionState(
    findAvailableSlotsAction,
    initialSlotState,
  );
  const [bookingState, bookingAction, booking] = useActionState(
    createBookingAction,
    initialBookingState,
  );

  const selectedService = services.find((service) => service.id === serviceId);

  const slotsMatch =
    slotState.status === "success" &&
    slotState.selection?.serviceId === serviceId &&
    slotState.selection?.appointmentDate === appointmentDate;

  const slotErrors = slotState.errors ?? {};
  const bookingErrors = bookingState.errors ?? {};
  const effectiveSelectedTime =
    slotsMatch && slotState.slots?.length
      ? (slotState.slots.find((slot) => slot.time === selectedTime)?.time ??
        slotState.slots[0].time)
      : "";

  if (bookingState.status === "success" && bookingState.appointment) {
    const appointment = bookingState.appointment;
    const date = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${appointment.appointmentDate}T00:00:00Z`));

    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-600/20 bg-emerald-50/80 p-6"
      >
        <CheckCircle2 className="size-7 text-emerald-700" />
        <h2 className="mt-3 font-heading text-2xl tracking-tight text-emerald-900">
          {bookingState.message}
        </h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-white/70 p-4">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Reference
            </dt>
            <dd className="mt-1 font-mono text-sm text-emerald-950">
              {appointment.reference}
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-4">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Date and time
            </dt>
            <dd className="mt-1 text-sm text-emerald-950">
              {date} at {formatClinicTime(appointment.startTime)}
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-4">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Format
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm text-emerald-950">
              {appointment.mode === "online" ? (
                <Video className="size-4" />
              ) : (
                <MapPin className="size-4" />
              )}
              {appointment.mode === "online" ? "Online" : "In person"}
            </dd>
          </div>
          <div className="rounded-xl bg-white/70 p-4">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-emerald-800">
              Fee
            </dt>
            <dd className="mt-1 text-sm text-emerald-950">
              {formatPkr(appointment.feePkr)}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-xs leading-5 text-emerald-900">
          A confirmation message is not sent yet because email and WhatsApp are
          not connected. Keep this page or your reference number; the clinic
          can also find the appointment from its dashboard.
        </p>
        <Button className="mt-5" variant="outline" asChild>
          <a href="/book">Book another appointment</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {bookingState.status === "error" && bookingState.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {bookingState.message}
        </p>
      )}

      <form action={slotAction} className="space-y-4 rounded-2xl border border-border/80 bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-xl tracking-tight">
            Find a genuine opening
          </h2>
          <Badge variant="outline" className="gap-1">
            <CalendarClock className="size-3" />
            {bookingApproval === "automatic" ? "Automatic confirmation" : "Clinic approval"}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="serviceId">Service</Label>
            <select
              id="serviceId"
              name="serviceId"
              value={serviceId}
              onChange={(event) => setServiceId(event.target.value)}
              required
              className={selectClassName}
              aria-invalid={slotErrors.serviceId ? true : undefined}
              aria-describedby={slotErrors.serviceId ? "serviceId-error" : undefined}
            >
              <option value="">Choose a service…</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — {service.mode === "online" ? "Online" : "In person"}
                </option>
              ))}
            </select>
            {slotErrors.serviceId && (
              <p id="serviceId-error" className="text-[0.7rem] text-destructive">
                {slotErrors.serviceId}
              </p>
            )}
            {selectedService && (
              <p className="text-[0.68rem] leading-4 text-muted-foreground">
                {selectedService.durationMinutes} minutes ·{" "}
                {formatPkr(selectedService.feePkr)} ·{" "}
                {selectedService.description}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appointmentDate">Appointment date</Label>
            <Input
              id="appointmentDate"
              name="appointmentDate"
              type="date"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
              required
              aria-invalid={slotErrors.appointmentDate ? true : undefined}
              aria-describedby={
                slotErrors.appointmentDate ? "appointmentDate-error" : undefined
              }
            />
            {slotErrors.appointmentDate && (
              <p
                id="appointmentDate-error"
                className="text-[0.7rem] text-destructive"
              >
                {slotErrors.appointmentDate}
              </p>
            )}
            <p className="text-[0.68rem] leading-4 text-muted-foreground">
              Slots outside clinic hours, closed weekdays, closures, overlap
              rules and full days are filtered out.
            </p>
          </div>
        </div>

        {slotState.status === "error" && slotState.message && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {slotState.message}
          </p>
        )}

        {slotState.status === "success" && slotState.message && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-lg border border-emerald-600/20 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            {slotState.message}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={findingSlots}>
            {findingSlots ? (
              <>
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
                Checking…
              </>
            ) : (
              "Check availability"
            )}
          </Button>
        </div>
      </form>

      {slotState.slots && slotsMatch && slotState.slots.length > 0 && (
        <form
          action={bookingAction}
          className="space-y-4 rounded-2xl border border-brand/20 bg-brand-soft/30 p-5"
        >
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="appointmentDate" value={appointmentDate} />
          <input type="hidden" name="startTime" value={effectiveSelectedTime} />

          <h2 className="font-heading text-xl tracking-tight">
            Choose a time and confirm
          </h2>

          <fieldset className="grid gap-2 sm:grid-cols-3">
            <legend className="sr-only">Available times</legend>
            {slotState.slots.map((slot) => (
              <label
                key={slot.time}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border/80 bg-card px-4 py-3 text-sm transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50"
              >
                <input
                  type="radio"
                  name="selectedTimeVisible"
                  value={slot.time}
                  checked={effectiveSelectedTime === slot.time}
                  onChange={() => setSelectedTime(slot.time)}
                  className="size-4 accent-brand"
                />
                {slot.label}
              </label>
            ))}
          </fieldset>
          {bookingErrors.startTime && (
            <p className="text-[0.7rem] text-destructive">
              {bookingErrors.startTime}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                autoComplete="name"
                placeholder="Your name"
                required
                aria-invalid={bookingErrors.fullName ? true : undefined}
                aria-describedby={
                  bookingErrors.fullName ? "fullName-error" : undefined
                }
              />
              {bookingErrors.fullName && (
                <p id="fullName-error" className="text-[0.7rem] text-destructive">
                  {bookingErrors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+92 300 0000000"
                required
                aria-invalid={bookingErrors.phone ? true : undefined}
                aria-describedby={bookingErrors.phone ? "phone-error" : undefined}
              />
              {bookingErrors.phone && (
                <p id="phone-error" className="text-[0.7rem] text-destructive">
                  {bookingErrors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address (optional)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={bookingErrors.email ? true : undefined}
              aria-describedby={bookingErrors.email ? "email-error" : undefined}
            />
            {bookingErrors.email && (
              <p id="email-error" className="text-[0.7rem] text-destructive">
                {bookingErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Anything the clinic should know? (optional)
            </Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Keep it brief. Do not include sensitive medical details."
              maxLength={500}
              aria-invalid={bookingErrors.notes ? true : undefined}
              aria-describedby={bookingErrors.notes ? "notes-error" : undefined}
            />
            {bookingErrors.notes && (
              <p id="notes-error" className="text-[0.7rem] text-destructive">
                {bookingErrors.notes}
              </p>
            )}
          </div>

          <Button type="submit" disabled={booking || !effectiveSelectedTime} className="w-full sm:w-auto">
            {booking ? (
              <>
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
                Reserving appointment…
              </>
            ) : (
              <>
                <CheckCircle2 data-icon="inline-start" />
                {bookingApproval === "automatic"
                  ? "Confirm appointment"
                  : "Request appointment"}
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
