import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Sparkles,
  Users,
} from "lucide-react";

import { PageIntro } from "@/components/public/page-intro";
import { Badge } from "@/components/ui/badge";
import {
  clinicHoursLabelFor,
  formatPkr,
  workingWeekdaySummaryFor,
} from "@/config/clinic";
import { getPublicClinicContent } from "@/lib/clinic/data";

export default async function ContactPage() {
  const { settings } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);
  const hasContactDetails = Boolean(
    settings.phone || settings.email || settings.address,
  );

  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title={
          <>
            We&apos;re here to
            <br className="hidden sm:block" /> help you{" "}
            <span className="italic text-brand">find your way.</span>
          </>
        }
        description="The clinic is appointment-only. Use this page to understand how to reach the right part of Nissa, or explore the services before your first visit."
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-brand" />
              <h2 className="font-heading text-2xl tracking-tight">
                Clinic hours
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {settings.walkInsEnabled
                ? "Appointments are planned within these hours. Walk-ins are also accepted when the clinic has room."
                : "Appointments are planned within these hours. Walk-ins are not available."}
            </p>

            <div className="mt-6 rounded-2xl bg-muted/50 p-5">
              <p className="text-sm font-semibold">{weekdaySummary}</p>
              <p className="mt-1 font-heading text-2xl tracking-tight">
                {hoursLabel}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {settings.appointmentDurationMinutes}-minute appointments ·{" "}
                {settings.dailyCapacity} patients per day
              </p>
            </div>

            <dl className="mt-5 divide-y divide-border/70">
              {[
                [
                  "Consultation fee",
                  formatPkr(settings.consultationFeePkr),
                ],
                [
                  "Booking approval",
                  settings.bookingApproval === "automatic"
                    ? "Automatic"
                    : "Reviewed by the clinic",
                ],
                [
                  "Online consultations",
                  settings.onlineConsultationEnabled ? "Available" : "Not available",
                ],
                [
                  "Walk-ins",
                  settings.walkInsEnabled ? "Available" : "Not available",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 py-2.5 text-sm"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-brand" />
                <h2 className="font-heading text-2xl tracking-tight">
                  Clinic details
                </h2>
              </div>
              {!hasContactDetails && (
                <Badge variant="outline">Being configured</Badge>
              )}
            </div>

            {hasContactDetails ? (
              <ul className="mt-5 space-y-3 text-sm">
                {settings.address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand" />
                    {settings.address}
                  </li>
                )}
                {settings.phone && (
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-brand" />
                    {settings.phone}
                  </li>
                )}
                {settings.email && (
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 size-4 shrink-0 text-brand" />
                    {settings.email}
                  </li>
                )}
              </ul>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/35 p-5">
                <p className="text-sm font-medium">
                  Contact details are not published yet.
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The clinic owner has not supplied an address, phone number or
                  email address. They will appear here once configured in Clinic
                  Settings. We have not invented placeholder details.
                </p>
              </div>
            )}

            <div className="mt-6 border-t border-border/70 pt-5">
              <h3 className="text-sm font-semibold">Where to start</h3>
              <ul className="mt-3 space-y-2.5 text-sm">
                <li>
                  <Link
                    href="/book"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <CalendarDays className="size-4 text-brand" />
                      Appointment booking
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ai-receptionist"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="size-4 text-brand" />
                      AI receptionist
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/feedback"
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3.5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2.5">
                      <MessageSquareText className="size-4 text-brand" />
                      Patient feedback
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
          <Users className="mt-0.5 size-4 shrink-0 text-brand" />
          Nissa is an appointment-only clinic. If you need urgent medical help,
          contact your local emergency service or the nearest hospital rather
          than waiting for a routine appointment.
        </div>
      </section>
    </>
  );
}
