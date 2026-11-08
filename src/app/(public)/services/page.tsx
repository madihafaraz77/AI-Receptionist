import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Pill,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { PageIntro } from "@/components/public/page-intro";
import { SectionHeading } from "@/components/public/section-heading";
import { ServiceCard } from "@/components/public/service-card";
import { Button } from "@/components/ui/button";
import {
  clinicHoursLabelFor,
  formatPkr,
  workingWeekdaySummaryFor,
} from "@/config/clinic";
import { getPublicClinicContent } from "@/lib/clinic/data";

export default async function ServicesPage() {
  const { settings, services } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);

  const included = [
    {
      icon: ClipboardList,
      title: "A full consultation",
      text: "The doctor records your symptoms, observations and progress in a private clinical record.",
    },
    {
      icon: Pill,
      title: "Prescriptions when appropriate",
      text: "Where the doctor considers it appropriate, a prescription is recorded in your patient profile.",
    },
    {
      icon: FileText,
      title: "A clear next step",
      text: `Follow-up visits can be scheduled with a reminder ${settings.followUpReminderHours} hours before the appointment.`,
    },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Services"
        title={
          <>
            Considered consultations,
            <br className="hidden sm:block" /> in person or{" "}
            <span className="italic text-brand">online.</span>
          </>
        }
        description={`Every Nissa consultation follows the same appointment-only format: ${settings.appointmentDurationMinutes} minutes, a private clinical record, and clear next steps.`}
      >
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5">
            {settings.appointmentDurationMinutes}-minute appointments
          </span>
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5">
            {formatPkr(settings.consultationFeePkr)} consultation fee
          </span>
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5">
            {weekdaySummary} · {hoursLabel}
          </span>
          <span className="rounded-full border border-border/80 bg-card px-3 py-1.5">
            {settings.onlineConsultationEnabled
              ? "Online consultations available"
              : "In-person consultations"}
          </span>
        </div>
      </PageIntro>

      <section className="container-page py-16 lg:py-20">
        <SectionHeading
          eyebrow="The service list"
          title="Care shaped around the conversation."
          description="The clinic manages its service catalogue and fees from the doctor dashboard. These are the current services."
        />

        {services.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/35 p-8 text-center">
            <p className="text-sm font-medium">
              No services are published right now.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              The clinic has not published a service catalogue yet. Please check
              back soon or contact the clinic.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
          Services are for consultation and clinical assessment only. No
          outcome or cure is promised. The doctor decides on any treatment or
          prescription during your consultation.
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/35">
        <div className="container-page py-16 lg:py-20">
          <SectionHeading
            eyebrow="What's included"
            title="More than a time slot."
            description="A consultation is a complete clinical conversation, recorded so your care has continuity."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {included.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-xl tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-8 rounded-3xl border border-border/80 bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">Fees & booking</p>
            <h2 className="mt-3 font-heading text-2xl tracking-tight sm:text-3xl">
              One clear consultation fee.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {formatPkr(settings.consultationFeePkr)} per{" "}
              {settings.appointmentDurationMinutes}-minute consultation,
              whether in person or online.{" "}
              {settings.bookingApproval === "automatic"
                ? "Booking approval is automatic."
                : "Bookings are reviewed by the clinic before they are confirmed."}{" "}
              {settings.walkInsEnabled
                ? "Walk-ins are accepted."
                : "Walk-ins are not available."}{" "}
              Payment arrangements are confirmed by the clinic.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button size="lg" asChild>
              <Link href="/book">
                Request an appointment
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/ai-receptionist">
                <Sparkles data-icon="inline-start" />
                Ask about services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
