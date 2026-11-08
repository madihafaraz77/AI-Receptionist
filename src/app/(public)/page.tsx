import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Bot,
  CalendarCheck2,
  Check,
  Clock3,
  HeartHandshake,
  Leaf,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";

import { SectionHeading } from "@/components/public/section-heading";
import { ServiceCard } from "@/components/public/service-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clinicHoursLabelFor,
  formatPkr,
  workingWeekdaySummaryFor,
} from "@/config/clinic";
import { getPublicClinicContent } from "@/lib/clinic/data";
import { isAiReceptionistConfigured } from "@/lib/ai/config";

const aiCapabilities = [
  "Answer questions about clinic hours, services and fees",
  "Check appointment availability and help request a booking",
  "Pass the conversation to the clinic team when needed",
  "Stay within administrative help — never medical advice",
];

export default async function HomePage() {
  const { settings, services } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);
  const aiConfigured = isAiReceptionistConfigured();

  const visitSteps = [
    {
      number: "01",
      title: "Choose a time",
      description:
        "Pick an in-person or online consultation. Online booking will open once the clinic connects its calendar.",
      icon: CalendarCheck2,
    },
    {
      number: "02",
      title: "Share your details",
      description:
        "Tell the clinic a little about yourself so your first conversation can start in the right place.",
      icon: HeartHandshake,
    },
    {
      number: "03",
      title: "Meet the doctor",
      description: `Spend ${settings.appointmentDurationMinutes} unhurried minutes discussing your history, your concerns and a plan for what comes next.`,
      icon: Stethoscope,
    },
  ];

  const approachCards = [
    {
      title: "Unhurried appointments",
      description: `Every consultation is ${settings.appointmentDurationMinutes} minutes, so there is room to talk things through without watching the clock.`,
      icon: Clock3,
    },
    {
      title: "In person or online",
      description: settings.onlineConsultationEnabled
        ? "Choose the format that fits your day. Online consultations follow the same considered format."
        : "In-person consultations follow the same considered format.",
      icon: Video,
    },
    {
      title: "Follow-ups that follow through",
      description: `The clinic schedules follow-up visits and sends a reminder ${settings.followUpReminderHours} hours before your appointment.`,
      icon: BellRing,
    },
    {
      title: "A helpful first hello",
      description:
        "The Nissa AI receptionist can answer approved clinic questions and help with controlled booking requests.",
      icon: Sparkles,
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 soft-glow" aria-hidden="true" />
        <div
          className="absolute inset-0 brand-grid opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
          aria-hidden="true"
        />

        <div className="container-page relative grid items-center gap-14 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-24">
          <div>
            <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
              <Leaf className="size-3.5 text-brand" />
              <span className="font-medium text-foreground">
                {settings.name}
              </span>
              <span className="size-1 rounded-full bg-border" />
              <span className="text-muted-foreground">
                {settings.onlineConsultationEnabled
                  ? "Online consultations available"
                  : "In-person consultations"}
              </span>
            </div>

            <h1 className="mt-6 font-heading text-[2.9rem] font-normal leading-[1.02] tracking-[-0.02em] text-balance sm:text-6xl lg:text-[4.4rem]">
              Care that begins
              <br />
              with <span className="italic text-brand">being heard.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground text-pretty sm:text-lg sm:leading-8">
              A modern homeopathic clinic experience built around unhurried
              conversations, thoughtful follow-ups, and a calm path from your
              first question to your next visit.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/book">
                  Book an appointment
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/ai-receptionist">
                  <Sparkles data-icon="inline-start" />
                  Meet the AI receptionist
                </Link>
              </Button>
            </div>

            <dl className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 border-t border-border/70 pt-6 sm:grid-cols-3">
              <div>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Consultation
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {settings.appointmentDurationMinutes} minutes
                </dd>
              </div>
              <div>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Fee
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatPkr(settings.consultationFeePkr)}
                </dd>
              </div>
              <div>
                <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Clinic hours
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {weekdaySummary} · {hoursLabel}
                </dd>
              </div>
            </dl>
          </div>

          {/* Visit card composition */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <div
              className="absolute -inset-3 -rotate-2 rounded-[2rem] border border-brand/10 bg-brand-soft/70"
              aria-hidden="true"
            />
            <div
              className="absolute -right-6 -top-8 hidden size-24 rounded-full border border-brand/10 bg-sand/80 blur-[1px] sm:block"
              aria-hidden="true"
            />

            <div className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-lift sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Inside a visit</p>
                  <h2 className="mt-2 font-heading text-2xl tracking-tight">
                    Time to be heard.
                  </h2>
                </div>
                <Badge variant="secondary" className="gap-1.5 whitespace-nowrap">
                  <Clock3 className="size-3" />
                  {settings.appointmentDurationMinutes} min
                </Badge>
              </div>

              <ol className="mt-7 space-y-5">
                {[
                  {
                    title: "Listen",
                    text: "A conversation about you, not a rushed checklist.",
                  },
                  {
                    title: "Understand",
                    text: "Your history, lifestyle and concerns considered together.",
                  },
                  {
                    title: "Plan",
                    text: "Clear next steps and a follow-up rhythm that fits your life.",
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand-soft text-[0.68rem] font-semibold text-brand">
                        {index + 1}
                      </span>
                      {index < 2 && (
                        <span className="mt-1 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/70 pt-5">
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Format
                  </p>
                  <p className="mt-1 text-sm font-medium">In-person or online</p>
                </div>
                <div>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Fee
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {formatPkr(settings.consultationFeePkr)}
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 -bottom-6 hidden items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 shadow-soft sm:flex">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <BellRing className="size-4" />
              </span>
              <div>
                <p className="text-xs font-semibold">Follow-up reminders</p>
                <p className="text-xs text-muted-foreground">
                  {settings.followUpReminderHours} hours before your visit
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="container-page py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="The Nissa approach"
              title={
                <>
                  A calmer rhythm
                  <br />
                  <span className="italic text-brand">of care.</span>
                </>
              }
              description="Nissa brings the warmth of a considered clinic visit together with the clarity of a modern, well-organised practice."
            />
            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand/10 bg-brand-soft/50 p-4 text-sm text-muted-foreground">
              <Leaf className="mt-0.5 size-4 shrink-0 text-brand" />
              <p>
                {settings.walkInsEnabled
                  ? "No rushed queues. Every visit is planned around a confirmed appointment, with walk-ins accepted when the clinic has room."
                  : "No rushed queues and no walk-ins. Every visit is planned around a confirmed appointment."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {approachCards.map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-brand">
                    <card.icon className="size-4.5" />
                  </span>
                </div>
                <h3 className="mt-4 text-sm font-semibold">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-muted/35">
        <div className="container-page py-16 lg:py-24">
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title={
              <>
                From first question to
                <br className="hidden sm:block" /> your first visit.
              </>
            }
            description="A simple path designed to feel clear at every step."
          />

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {visitSteps.map((step) => (
              <article
                key={step.number}
                className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading text-3xl text-brand/25">
                    {step.number}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <step.icon className="size-4.5" />
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-xl tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {step.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/book">
                See how booking will work
                <ArrowUpRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="container-page py-16 lg:py-24">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Consultations"
            title="Care shaped around the conversation."
            description={`Every service follows the same ${settings.appointmentDurationMinutes}-minute, appointment-only format. The clinic manages its service list and fees from its dashboard.`}
          />
          <Button variant="ghost" asChild className="self-start sm:self-auto">
            <Link href="/services">
              View all services
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

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
      </section>

      {/* AI receptionist */}
      <section className="container-page pb-16 lg:pb-24">
        <div className="overflow-hidden rounded-3xl bg-brand-deep text-primary-foreground">
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:p-12">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground/50">
                The AI receptionist
              </p>
              <h2 className="mt-3 font-heading text-3xl font-normal tracking-tight text-balance sm:text-4xl">
                A helpful first hello,
                <br />
                <span className="italic text-primary-foreground/80">
                  any time of day.
                </span>
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-primary-foreground/65">
                {aiConfigured
                  ? "Nissa's administrative assistant is connected for clinic information and controlled booking help. It works only from approved clinic information and never diagnoses or prescribes."
                  : "Nissa's administrative assistant is not connected yet. It will open once the clinic configures its OpenAI key and model."}
              </p>

              <ul className="mt-6 space-y-3">
                {aiCapabilities.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-primary-foreground/75"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-primary-foreground text-brand-deep hover:bg-primary-foreground/90"
                  asChild
                >
                  <Link href="/ai-receptionist">
                    {aiConfigured ? "Open the assistant" : "AI assistant status"}
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  asChild
                >
                  <Link href="/book">Book with the clinic</Link>
                </Button>
              </div>
            </div>

            <div className="relative rounded-3xl border border-primary-foreground/10 bg-primary-foreground/5 p-6 shadow-lift sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="eyebrow text-primary-foreground/70">Current status</p>
                  <h3 className="mt-2 font-heading text-2xl tracking-tight text-primary-foreground">
                    {aiConfigured ? "Connected, administrative only." : "Not connected yet."}
                  </h3>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary-foreground/20 text-primary-foreground/90"
                >
                  {aiConfigured ? "OpenAI enabled" : "Disabled"}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-primary-foreground/70">
                The assistant answers from the clinic&apos;s live approved settings and knowledge base.
                It does not diagnose, prescribe or replace the doctor.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 px-4 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/10 text-primary-foreground">
                  <Bot className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    Administrative help
                  </p>
                  <p className="text-xs text-primary-foreground/65">
                    {aiConfigured
                      ? "Approved clinic information and controlled booking tools are available on the assistant page."
                      : "Online chat is disabled until the server key and model are configured."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-sand/60 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
          <div
            className="absolute -right-16 -top-16 size-64 rounded-full border border-brand/10 bg-brand-soft/50"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 right-24 size-40 rounded-full border border-brand/10"
            aria-hidden="true"
          />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="eyebrow">Ready when you are</p>
              <h2 className="mt-3 max-w-2xl font-heading text-3xl font-normal tracking-tight text-balance sm:text-4xl">
                Your first visit starts with a conversation.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                Appointments are available {weekdaySummary}, {hoursLabel}.{" "}
                {settings.onlineConsultationEnabled
                  ? "Online consultations are available."
                  : "Online consultations are not currently offered."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button size="lg" asChild>
                <Link href="/book">
                  Book an appointment
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">Contact the clinic</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
