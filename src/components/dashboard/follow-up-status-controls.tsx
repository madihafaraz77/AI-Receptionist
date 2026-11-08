"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  initialFollowUpActionState,
  setFollowUpStatusAction,
} from "@/app/dashboard/follow-ups/actions";

export function FollowUpStatusControls({
  followUpId,
  status,
}: {
  followUpId: string;
  status: "scheduled" | "sent" | "completed" | "cancelled";
}) {
  const [state, formAction, isPending] = useActionState(
    setFollowUpStatusAction,
    initialFollowUpActionState,
  );

  if (status !== "scheduled" && status !== "sent") {
    return null;
  }

  const errors = state.errors ?? {};

  return (
    <form
      action={formAction}
      className="border-t border-border/70 bg-muted/20 px-4 py-4 sm:px-5"
    >
      <input type="hidden" name="followUpId" value={followUpId} />
      <fieldset disabled={isPending} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" name="status" value="completed">
            Mark completed
          </Button>

          <details className="group relative">
            <summary className="inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50">
              Cancel follow-up
            </summary>
            <div className="mt-3 max-w-md space-y-2 rounded-xl border border-destructive/15 bg-white p-3 shadow-soft">
              <label
                htmlFor={`follow-up-reason-${followUpId}`}
                className="text-xs font-medium"
              >
                Cancellation reason
              </label>
              <Textarea
                id={`follow-up-reason-${followUpId}`}
                name="cancellationReason"
                rows={2}
                placeholder="Patient no longer needs follow-up…"
                maxLength={500}
                aria-invalid={errors.cancellationReason ? true : undefined}
                aria-describedby={
                  errors.cancellationReason
                    ? `follow-up-reason-error-${followUpId}`
                    : undefined
                }
              />
              {errors.cancellationReason && (
                <p
                  id={`follow-up-reason-error-${followUpId}`}
                  className="text-[0.7rem] text-destructive"
                >
                  {errors.cancellationReason}
                </p>
              )}
              <Button
                type="submit"
                name="status"
                value="cancelled"
                variant="destructive"
                className="w-full"
              >
                {isPending ? (
                  <>
                    <LoaderCircle
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                    Cancelling…
                  </>
                ) : (
                  "Confirm cancellation"
                )}
              </Button>
            </div>
          </details>
        </div>

        {state.status === "error" && state.message && (
          <p role="alert" className="flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {state.message}
          </p>
        )}

        {state.status === "success" && state.message && (
          <p
            role="status"
            className="flex items-start gap-2 text-xs text-emerald-700"
          >
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            {state.message}
          </p>
        )}
      </fieldset>
    </form>
  );
}
