import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Leaf,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { PageIntro } from "@/components/public/page-intro";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";
import {
  clinicHoursLabelFor,
  formatPkr,
  workingWeekdaySummaryFor,
} from "@/config/clinic";
import { getPublicClinicContent } from "@/lib/clinic/data";

const expectations = [
  "A confirmed appointment, never a walk-in queue",
  "In-person or online consultation",
  "A clear follow-up plan when one is needed",
  "Private clinical records kept in the clinic system",
  "Administrative help from the AI receptionist",
];

export default async function AboutPage() {
  const { settings } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);

  const expectationsWithTime = [
    expectations[0],
    `${settings.appointmentDurationMinutes} unhurried minutes with the doctor`,
    ...expectations.slice(1),
  ];

  const principles = [
    {
      icon: Clock3,
      title: "Time is part of care",
      text: `A ${settings.appointmentDurationMinutes}-minute appointment gives the doctor room to listen properly and gives you room to ask questions.`,
    },
    {
      icon: Users,
      title: "A deliberately small day",
      text: `The clinic limits each day to ${settings.dailyCapacity} patients so appointments are not rushed.`,
    },
    {
      icon: CalendarClock,
      title: "Follow-up with intention",
      text: `Follow-up visits are scheduled by the doctor, with a reminder ${settings.followUpReminderHours} hours before.`,
    },
  ];

  const missingProfile =
    !settings.address || !settings.phone || !settings.doctorName;

  return (
    <>
      <PageIntro
        eyebrow="About the clinic"
        title={
          <>
            A quiet, considered place
            <br className="hidden sm:block" /> for{" "}
            <span className="italic text-brand">care.</span>
          </>
        }
        description="Nissa Homeopathic Clinic brings a calm, modern structure to homeopathic care: confirmed appointments, generous consultation time, and a clear record of every visit."
      />

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Our approach"
              title="Care that starts with listening."
            />
            <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              <p>
                A clinic visit should not feel like a transaction squeezed
                between other tasks. Nissa is built around the idea that good
                care begins with a proper conversation — one where your history,
                your daily life and your concerns are considered together.
              </p>
              <p>
                Every appointment is planned in advance.{" "}
                {settings.walkInsEnabled
                  ? "Walk-ins are accepted when the clinic has room."
                  : "There are no walk-ins and no unpredictable queues."}{" "}
                There is no need to repeat your story at every visit. The clinic
                keeps a structured record of your consultations, prescriptions
                and follow-ups.
              </p>
              <p>
                The doctor remains at the centre of every clinical decision. The
                AI receptionist is being built for administrative help only —
                clinic information, availability and booking requests.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {expectationsWithTime.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-card p-3.5 text-sm"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Check className="size-3" />
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <Leaf className="size-4 text-brand" />
                <h2 className="font-heading text-xl tracking-tight">
                  At a glance
                </h2>
              </div>

              <dl className="mt-5 divide-y divide-border/70">
                {[
                  ["Working days", weekdaySummary],
                  ["Clinic hours", hoursLabel],
                  [
                    "Appointment length",
                    `${settings.appointmentDurationMinutes} minutes`,
                  ],
                  ["Daily capacity", `${settings.dailyCapacity} patients`],
                  ["Consultation fee", formatPkr(settings.consultationFeePkr)],
                  [
                    "Booking approval",
                    settings.bookingApproval === "automatic"
                      ? "Automatic"
                      : "Reviewed by the clinic",
                  ],
                  [
                    "Walk-ins",
                    settings.walkInsEnabled ? "Available" : "Not available",
                  ],
                  [
                    "Online consultations",
                    settings.onlineConsultationEnabled
                      ? "Available"
                      : "Not available",
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

              <Button className="mt-6 w-full" asChild>
                <Link href="/book">
                  Request an appointment
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>

            {missingProfile && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" />
                The clinic address, phone number and doctor profile will be
                published once the clinic owner configures them in the dashboard.
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/35">
        <div className="container-page py-16 lg:py-20">
          <SectionHeading
            align="center"
            eyebrow="Appointment-only by design"
            title="Small by choice, not by accident."
            description="The clinic's operating defaults are designed to protect the quality of every visit."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <principle.icon className="size-5" />
                </span>
                <h3 className="mt-5 font-heading text-xl tracking-tight">
                  {principle.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {principle.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-6 rounded-3xl border border-border/80 bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" />
              <p className="eyebrow">The AI receptionist</p>
            </div>
            <h2 className="mt-3 font-heading text-2xl tracking-tight sm:text-3xl">
              Administrative help, not medical advice.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Nissa&apos;s AI receptionist is being prepared to answer clinic
              questions, explain services and help with appointment requests.
              It will never diagnose, prescribe, or replace the doctor.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/ai-receptionist">
              Learn more
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
