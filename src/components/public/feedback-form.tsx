"use client";

import { useActionState, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { submitFeedbackAction } from "@/app/(public)/feedback/actions";
import { initialFeedbackSubmissionState } from "@/app/(public)/feedback/action-state";

export function FeedbackForm() {
  const [state, formAction, isPending] = useActionState(
    submitFeedbackAction,
    initialFeedbackSubmissionState,
  );
  const [rating, setRating] = useState(5);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-600/20 bg-emerald-50/80 p-6 text-center"
      >
        <CheckCircle2 className="mx-auto size-8 text-emerald-700" />
        <p className="mt-3 font-heading text-2xl tracking-tight text-emerald-950">
          {state.message}
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Feedback is private and will not be published or shown publicly.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      )}

      <fieldset disabled={isPending} className="space-y-5">
        <input type="hidden" name="rating" value={rating} />
        <div className="space-y-2">
          <Label>Overall visit</Label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} out of 5 stars`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  value <= rating
                    ? "border-amber-400 bg-amber-50 text-amber-500"
                    : "border-border/70 bg-muted/40 text-muted-foreground",
                )}
              >
                <span aria-hidden="true">★</span>
              </button>
            ))}
            <span className="ml-2 text-xs text-muted-foreground">
              {rating} of 5
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="comment">Your feedback</Label>
          <Textarea
            id="comment"
            name="comment"
            rows={5}
            required
            minLength={10}
            maxLength={1000}
            placeholder="What went well? What could the clinic improve?"
            aria-describedby="feedback-note"
          />
          <p id="feedback-note" className="text-[0.68rem] text-muted-foreground">
            10–1,000 characters. Do not include urgent medical concerns.
          </p>
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            Submitting…
          </>
        ) : (
          <>
            <MessageSquareText data-icon="inline-start" />
            Submit feedback
          </>
        )}
      </Button>
    </form>
  );
}
