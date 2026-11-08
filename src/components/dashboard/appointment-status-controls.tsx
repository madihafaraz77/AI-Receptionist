"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  initialAppointmentActionState,
  setAppointmentStatusAction,
} from "@/app/dashboard/appointments/actions";

export function AppointmentStatusControls({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show" | "rescheduled";
}) {
  const [state, formAction, isPending] = useActionState(
    setAppointmentStatusAction,
    initialAppointmentActionState,
  );

  if (status !== "pending" && status !== "confirmed") {
    return null;
  }

  const errors = state.errors ?? {};

  return (
    <form
      action={formAction}
      className="border-t border-border/70 bg-muted/20 px-5 py-4"
    >
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <fieldset disabled={isPending} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {status === "pending" && (
            <Button type="submit" name="status" value="confirmed">
              Confirm
            </Button>
          )}
          <Button
            type="submit"
            name="status"
            value="completed"
            variant={status === "pending" ? "outline" : "default"}
          >
            Mark completed
          </Button>
          <details className="group relative">
            <summary className="inline-flex cursor-pointer list-none items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive outline-none transition-colors hover:bg-destructive/10 focus-visible:ring-3 focus-visible:ring-ring/50">
              Cancel appointment
            </summary>
            <div className="mt-3 max-w-md space-y-2 rounded-xl border border-destructive/15 bg-white p-3 shadow-soft">
              <label
                htmlFor={`cancellation-reason-${appointmentId}`}
                className="text-xs font-medium"
              >
                Cancellation reason
              </label>
              <Textarea
                id={`cancellation-reason-${appointmentId}`}
                name="cancellationReason"
                rows={2}
                placeholder="Patient asked to cancel, duplicate booking…"
                maxLength={500}
                aria-invalid={errors.cancellationReason ? true : undefined}
                aria-describedby={
                  errors.cancellationReason
                    ? `cancellation-reason-error-${appointmentId}`
                    : undefined
                }
              />
              {errors.cancellationReason && (
                <p
                  id={`cancellation-reason-error-${appointmentId}`}
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
          <p
            role="alert"
            className="flex items-start gap-2 text-xs text-destructive"
          >
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
