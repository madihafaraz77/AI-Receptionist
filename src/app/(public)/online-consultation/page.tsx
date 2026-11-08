import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  FileText,
  Headphones,
  ShieldCheck,
  Video,
  Wifi,
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

const preparation = [
  "A quiet, private space for the conversation",
  "A stable internet connection and a charged device",
  "Any reports or documents you want to discuss",
  "Your current medicines or prescription list",
];

export default async function OnlineConsultationPage() {
  const { settings } = await getPublicClinicContent();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);

  return (
    <>
      <PageIntro
        eyebrow="Online consultation"
        title={
          <>
            The same considered care,
            <br className="hidden sm:block" /> from{" "}
            <span className="italic text-brand">home.</span>
          </>
        }
        description={`Online consultations are available for patients who prefer to speak with the doctor without travelling to the clinic. The format is the same ${settings.appointmentDurationMinutes}-minute, appointment-only conversation.`}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Video className="size-3" />
            {settings.onlineConsultationEnabled
              ? "Online consultations enabled"
              : "Online consultations not currently offered"}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            Video calling not yet integrated
          </Badge>
        </div>
      </PageIntro>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Before you book"
              title="What to expect from an online visit."
              description="Online consultations are a booking type today. A video-call provider has not been connected yet, so meeting links are not generated automatically."
            />

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-brand/15 bg-brand-soft/60 p-4">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" />
              <p className="text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">
                  Honest status:
                </span>{" "}
                the clinic will confirm how your online consultation will take
                place once a video provider is integrated and tested. We do not
                claim that video calling works today.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: CalendarClock,
                  title: "Book the same way",
                  text: "Choose an online consultation during booking. The clinic confirms the appointment like any other visit.",
                },
                {
                  icon: Video,
                  title: "Join from a quiet space",
                  text: "Once video calling is integrated, the clinic will share joining details before your appointment.",
                },
                {
                  icon: FileText,
                  title: "Your record stays complete",
                  text: "The doctor records notes, progress and any prescription in the same private clinical record.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-border/80 bg-card p-5 shadow-soft"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                    <item.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
              <h2 className="font-heading text-xl tracking-tight">
                Online visit details
              </h2>
              <dl className="mt-4 divide-y divide-border/70">
                {[
                  ["Format", "Online consultation"],
                  [
                    "Length",
                    `${settings.appointmentDurationMinutes} minutes`,
                  ],
                  ["Fee", formatPkr(settings.consultationFeePkr)],
                  ["Working days", weekdaySummary],
                  ["Clinic hours", hoursLabel],
                  [
                    "Booking approval",
                    settings.bookingApproval === "automatic"
                      ? "Automatic"
                      : "Reviewed by the clinic",
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
              <Button className="mt-5 w-full" asChild>
                <Link href="/book">
                  Go to booking
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
              <div className="flex items-center gap-2">
                <Headphones className="size-4 text-brand" />
                <h2 className="text-sm font-semibold">Prepare for your visit</h2>
              </div>
              <ul className="mt-3 space-y-2.5">
                {preparation.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <Check className="size-3" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
              <Wifi className="mt-0.5 size-4 shrink-0 text-brand" />
              If your internet connection drops during a consultation, the
              clinic will contact you using the details on your booking.
            </div>
          </aside>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/35">
        <div className="container-page flex flex-col items-start justify-between gap-4 py-10 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-brand" />
            <p className="max-w-xl text-sm text-muted-foreground">
              Online consultations follow clinic hours, {weekdaySummary},{" "}
              {hoursLabel}.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/services">Compare services</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
