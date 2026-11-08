import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Info,
  MapPin,
  Sparkles,
  Users,
  Video,
} from "lucide-react";

import { PageIntro } from "@/components/public/page-intro";
import { SectionHeading } from "@/components/public/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clinicHoursLabelFor,
  formatPkr,
  workingWeekdaySummaryFor,
} from "@/config/clinic";
import { getPublicClinicContent } from "@/lib/clinic/data";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { BookingForm } from "@/components/public/booking-form";

// Availability is checked on the server on every booking request.
export const instant = false;

export default async function BookPage() {
  const { settings, services, source } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);
  const bookingConfigured = Boolean(getSupabaseConfig()?.secretKey);
  const bookingOpen =
    bookingConfigured &&
    source === "database" &&
    Boolean(settings.timezone) &&
    services.length > 0;

  const bookingSteps = [
    {
      number: "01",
      title: "Choose a consultation type",
      text: `Select an in-person or online visit. Both follow the same ${settings.appointmentDurationMinutes}-minute format.`,
    },
    {
      number: "02",
      title: "Pick an available time",
      text: `The clinic calendar will show only real openings, based on the ${settings.dailyCapacity}-patient daily limit.`,
    },
    {
      number: "03",
      title: "Confirm your details",
      text:
        settings.bookingApproval === "automatic"
          ? "Your booking is validated and confirmed immediately if the slot is free. The doctor sees the same appointment in the dashboard."
          : "The clinic reviews your request before it is confirmed. You will see the real status, never a guessed one.",
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Appointment booking"
        title={
          <>
            Find a time that
            <br className="hidden sm:block" /> fits your{" "}
            <span className="italic text-brand">day.</span>
          </>
        }
        description={
          bookingOpen
            ? "Nissa uses confirmed, appointment-only scheduling. Every opening shown below is checked against the clinic's real capacity, closures and reserved slots."
            : "Nissa uses confirmed, appointment-only scheduling. Online booking is not available through this page until the clinic finishes its Supabase setup."
        }
      >
        <Badge variant="outline" className="gap-1.5">
          <CalendarClock className="size-3" />
          {bookingOpen ? "Online booking available" : "Online booking is not available yet"}
        </Badge>
      </PageIntro>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          <div>
            {bookingOpen ? (
              <BookingForm
                services={services}
                bookingApproval={settings.bookingApproval}
              />
            ) : (
              <div className="rounded-2xl border border-amber-600/20 bg-amber-50/70 p-5 sm:p-6">
                <Info className="size-5 text-amber-800" />
                <h2 className="mt-3 font-heading text-2xl tracking-tight text-amber-950">
                  Booking is not connected yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-950">
                  {!bookingConfigured
                    ? "This environment does not have the server-side Supabase secret key. The website will not pretend to reserve a slot until the clinic's database and secret key are connected."
                    : source !== "database"
                      ? "The website cannot read the live clinic settings and service list. Apply the migrations and start the app with Supabase configured."
                      : !settings.timezone
                        ? "The clinic has not configured its timezone. Online booking cannot know the clinic's date and time until that is set in Clinic Settings."
                        : "The clinic has no active services to book yet. The doctor can add one in the dashboard."}
                </p>
                <p className="mt-3 text-xs leading-5 text-amber-900">
                  Once connected, this page will show genuine slots only and will
                  not confirm anything unless the database accepts the
                  appointment.
                </p>
              </div>
            )}

            <div className="mt-10">
              <SectionHeading
                eyebrow={bookingOpen ? "How booking works" : "How booking will work"}
                title="Three clear steps."
                description="No waiting for a callback and no double-booking. The backend validates every slot before it is confirmed."
              />

              <ol className="mt-8 space-y-4">
                {bookingSteps.map((step) => (
                  <li
                    key={step.number}
                    className="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
                  >
                    <span className="font-heading text-2xl text-brand/30">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-10">
              <h2 className="text-sm font-semibold">What you will need</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  "Your full name",
                  "A phone number for the clinic",
                  "An email address (optional, kept for the patient record)",
                  "Your preferred consultation type",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
              <h2 className="font-heading text-xl tracking-tight">
                Clinic booking details
              </h2>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Appointment types
                  </p>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-4 text-brand" />
                      In-person consultation
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Video className="size-4 text-brand" />
                      {settings.onlineConsultationEnabled
                        ? "Online consultation"
                        : "Online consultation (not currently offered)"}
                    </div>
                  </div>
                </div>

                <dl className="divide-y divide-border/70">
                  {[
                    ["Working days", weekdaySummary],
                    ["Clinic hours", hoursLabel],
                    [
                      "Appointment length",
                      `${settings.appointmentDurationMinutes} minutes`,
                    ],
                    ["Daily capacity", `${settings.dailyCapacity} patients`],
                    [
                      "Consultation fee",
                      formatPkr(settings.consultationFeePkr),
                    ],
                    [
                      "Approval",
                      settings.bookingApproval === "automatic"
                        ? "Automatic"
                        : "Reviewed by the clinic",
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

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 p-3.5 text-xs leading-5 text-muted-foreground">
                <Users className="mt-0.5 size-4 shrink-0 text-brand" />
                Capacity is enforced by the clinic backend, not by this page.
                Cancelled appointments release their slot.
              </div>

              <Button className="mt-5 w-full" variant="outline" asChild>
                <Link href="/contact">Contact the clinic</Link>
              </Button>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-destructive/15 bg-destructive/5 p-4 text-xs leading-5 text-muted-foreground">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-destructive" />
              This page is not for urgent medical concerns. If you need urgent
              help, contact your local emergency service or the nearest
              hospital.
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/35">
        <div className="container-page flex flex-col items-start justify-between gap-4 py-10 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold">
              {bookingOpen ? "Explore more" : "While booking is being set up"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {bookingOpen
                ? "View services or meet the AI receptionist. Booking confirmations are still in-app only until email and WhatsApp are connected."
                : "Explore the services or see how the AI receptionist will help."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" asChild>
              <Link href="/services">
                View services
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild>
              <Link href="/ai-receptionist">
                <Sparkles data-icon="inline-start" />
                AI receptionist
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
