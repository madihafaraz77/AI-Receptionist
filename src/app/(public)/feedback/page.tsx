import Link from "next/link";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

import { PageIntro } from "@/components/public/page-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FeedbackForm } from "@/components/public/feedback-form";

export default function FeedbackPage() {
  return (
    <>
      <PageIntro
        eyebrow="Patient feedback"
        title={
          <>
            Tell us how your
            <br className="hidden sm:block" /> visit{" "}
            <span className="italic text-brand">felt.</span>
          </>
        }
        description="Feedback helps the clinic improve the experience around your care — from booking and communication to the visit itself. This form is private and reviewed by the doctor."
      >
        <Badge variant="outline" className="gap-1.5">
          <MessageSquareText className="size-3" />
          Private by default
        </Badge>
      </PageIntro>

      <section className="container-page py-16 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl tracking-tight">
                    Private feedback
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Reviewed by the doctor; never published publicly.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <FeedbackForm />
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/40 p-4 text-xs leading-5 text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-4 shrink-0 text-brand" />
              Feedback will never be published publicly without the
              patient&apos;s permission. The doctor reviews submissions in the
              dashboard.
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-soft">
              <h2 className="font-heading text-xl tracking-tight">
                What feedback covers
              </h2>
              <ul className="mt-4 space-y-3">
                {[
                  "The booking and confirmation experience",
                  "Communication before your appointment",
                  "The consultation itself",
                  "Follow-up and reminders",
                  "Anything the clinic could do better",
                ].map((item) => (
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

            <div className="rounded-2xl border border-border/80 bg-brand-soft/50 p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-brand" />
                <h2 className="text-sm font-semibold">A private channel</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Feedback is stored in the clinic system and reviewed by the
                doctor. It is not a place to share urgent medical concerns. If
                you need urgent help, contact your local emergency service.
              </p>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/contact">
                Contact the clinic
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </aside>
        </div>
      </section>
    </>
  );
}
