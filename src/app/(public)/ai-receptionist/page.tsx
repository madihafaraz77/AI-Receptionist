import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  Check,
  Headset,
  Languages,
  LockKeyhole,
  MessageSquareText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

import { AiChat } from "@/components/public/ai-chat";
import { PageIntro } from "@/components/public/page-intro";
import { SectionHeading } from "@/components/public/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  clinicHoursLabelFor,
  workingWeekdaySummaryFor,
} from "@/config/clinic";
import { getPublicClinicContent } from "@/lib/clinic/data";
import { isAiReceptionistConfigured } from "@/lib/ai/config";
import { getSupabaseConfig } from "@/lib/supabase/config";

const canHelp = [
  {
    icon: MessageSquareText,
    title: "Clinic questions",
    text: "Hours, working days, services, fees and clinic policies from an approved knowledge base.",
  },
  {
    icon: CalendarCheck2,
    title: "Appointment help",
    text: "Check genuine availability and help request a booking using controlled backend tools.",
  },
  {
    icon: Headset,
    title: "Human handover",
    text: "Pass the conversation to the clinic team with the full context when a person is needed.",
  },
  {
    icon: Languages,
    title: "English first",
    text: "The first release supports English, with the architecture prepared for Urdu and Roman Urdu.",
  },
];

const neverDoes = [
  "Diagnose a condition or interpret medical reports",
  "Recommend, prescribe or change medicines",
  "Create clinical records or access unrestricted patient data",
  "Invent clinic information or claim a booking is confirmed without backend confirmation",
];

export default async function AiReceptionistPage() {
  const { settings } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);
  const aiConfigured = isAiReceptionistConfigured();
  const loggingReady = Boolean(getSupabaseConfig()?.secretKey);

  return (
    <>
      <PageIntro
        eyebrow="AI receptionist"
        title={
          <>
            A helpful first hello,
            <br className="hidden sm:block" /> built with{" "}
            <span className="italic text-brand">boundaries.</span>
          </>
        }
        description="Nissa's AI receptionist is being built to handle administrative questions and appointment requests — carefully, transparently, and always within approved clinic information."
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Bot className="size-3" />
            {aiConfigured ? "OpenAI connected" : "Not connected"}
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="size-3" />
            Administrative help only
          </Badge>
        </div>
      </PageIntro>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="What it is"
              title="A receptionist, not a doctor."
              description="The AI receptionist helps with the parts of a clinic visit that do not require clinical judgement. The doctor remains responsible for every clinical decision."
            />

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand-soft/60 p-4">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" />
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">
                  Current status:
                </span>{" "}
                {aiConfigured
                  ? "the public assistant is connected to OpenAI and remains administrative only; booking tools are not connected from this chat."
                  : "the OpenAI API key and model are not configured. The assistant is visibly disabled and will not pretend to answer."}
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {canHelp.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <item.icon className="size-4.5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute -inset-3 rotate-2 rounded-[2rem] border border-brand/10 bg-brand-soft/60"
              aria-hidden="true"
            />
            <div className="relative">
              <AiChat configured={aiConfigured} loggingReady={loggingReady} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-muted/35">
        <div className="container-page py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-brand" />
                <h2 className="font-heading text-2xl tracking-tight">
                  What it will never do
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                These are hard boundaries in the AI design, not optional
                behaviour.
              </p>
              <ul className="mt-5 space-y-3">
                {neverDoes.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <X className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <TriangleAlert className="size-5 text-brand" />
                <h2 className="font-heading text-2xl tracking-tight">
                  When a human is needed
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The AI can escalate a conversation to the clinic team. The
                dashboard becomes the reliable record of that handover.
              </p>
              <ol className="mt-5 space-y-3">
                {[
                  "The AI creates an escalation with the conversation context",
                  "The doctor receives an in-app notification",
                  "The conversation moves to needs_human or doctor_handling",
                  "The doctor replies, resolves the conversation and the outcome is tracked",
                ].map((item, index) => (
                  <li key={item} className="flex gap-3 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-brand/20 bg-brand-soft text-[0.68rem] font-semibold text-brand">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-muted/50 p-3.5 text-xs leading-5 text-muted-foreground">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-brand" />
                The AI never receives unrestricted access to clinical records.
                Escalation shares only what is needed for the clinic team to
                help.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-8 rounded-3xl border border-border/80 bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-brand" />
              <p className="eyebrow">Clinic information</p>
            </div>
            <h2 className="mt-3 font-heading text-2xl tracking-tight sm:text-3xl">
              For now, the clinic is still the best source.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {aiConfigured
                ? "Use the connected administrative assistant for clinic information, or use the clinic pages and /book for the most direct route."
                : "Until the AI receptionist is connected and tested, use the clinic pages for confirmed information: "}
              {!aiConfigured ? `${weekdaySummary}, ${hoursLabel}.` : null}
              {!aiConfigured && settings.onlineConsultationEnabled
                ? " Online consultations are available."
                : !aiConfigured
                  ? " Online consultations are not currently offered."
                  : null}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" />
                Approved information only
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" />
                Backend-validated bookings
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="size-3.5 text-brand" />
                Human handover
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button size="lg" asChild>
              <Link href="/book">
                Appointment booking
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Contact the clinic</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
