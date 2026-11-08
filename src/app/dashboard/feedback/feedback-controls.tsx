"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  initialFeedbackActionState,
  setFeedbackStatusAction,
} from "./actions";

export function FeedbackControls({
  id,
  status,
}: {
  id: string;
  status: "new" | "reviewed" | "responded" | "archived";
}) {
  const [state, formAction, isPending] = useActionState(
    setFeedbackStatusAction,
    initialFeedbackActionState,
  );

  return (
    <form
      action={formAction}
      className="border-t border-border/70 bg-muted/20 px-4 py-3 sm:px-5"
    >
      <input type="hidden" name="id" value={id} />
      <fieldset disabled={isPending} className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {status !== "reviewed" && status !== "archived" && (
            <Button type="submit" name="status" value="reviewed" variant="outline" size="sm">
              Mark reviewed
            </Button>
          )}
          {status !== "archived" && (
            <Button type="submit" name="status" value="archived" variant="ghost" size="sm">
              Archive
            </Button>
          )}
        </div>
        <details className="rounded-xl border border-border/70 bg-card p-3">
          <summary className="cursor-pointer text-xs font-medium">
            Private response
          </summary>
          <Textarea
            name="response"
            rows={3}
            maxLength={1000}
            placeholder="Private note for the clinic. This is not sent to the patient yet."
            className="mt-2"
          />
          <Button type="submit" name="status" value="responded" size="sm" className="mt-2">
            {isPending ? (
              <>
                <LoaderCircle className="animate-spin" data-icon="inline-start" />
                Saving…
              </>
            ) : (
              "Save response"
            )}
          </Button>
        </details>

        {state.status === "error" && state.message && (
          <p role="alert" className="flex items-start gap-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {state.message}
          </p>
        )}
        {state.status === "success" && state.message && (
          <p role="status" className="flex items-start gap-2 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            {state.message}
          </p>
        )}
      </fieldset>
    </form>
  );
}
