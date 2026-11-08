"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  initialAiConversationActionState,
  setAiConversationStatusAction,
} from "@/app/dashboard/ai-receptionist/actions";

export function ConversationControls({
  conversationId,
  status,
}: {
  conversationId: string;
  status: "active" | "needs_human" | "handed_over" | "closed";
}) {
  const [state, formAction, isPending] = useActionState(
    setAiConversationStatusAction,
    initialAiConversationActionState,
  );

  if (status === "closed") {
    return null;
  }

  return (
    <form
      action={formAction}
      className="border-t border-border/70 bg-muted/20 px-5 py-4"
    >
      <input type="hidden" name="conversationId" value={conversationId} />
      <fieldset disabled={isPending} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {status === "active" && (
            <Button type="submit" name="status" value="needs_human" variant="outline">
              Mark needs human
            </Button>
          )}
          <Button
            type="submit"
            name="status"
            value="handed_over"
            variant="default"
          >
            Assign to me
          </Button>
          {status !== "active" && (
            <Button
              type="submit"
              name="status"
              value="active"
              variant="ghost"
            >
              Return to AI
            </Button>
          )}
          <Button type="submit" name="status" value="closed" variant="destructive">
            {isPending ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
                Saving…
              </>
            ) : (
              "Close conversation"
            )}
          </Button>
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
