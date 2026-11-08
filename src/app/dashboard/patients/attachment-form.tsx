"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LoaderCircle, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { uploadPatientAttachmentAction } from "./actions";
import { initialPatientActionState } from "./action-state";

export function AttachmentForm({ patientId }: { patientId: string }) {
  const [state, formAction, isPending] = useActionState(
    uploadPatientAttachmentAction,
    initialPatientActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="patientId" value={patientId} />

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

      <div className="space-y-1.5">
        <Label htmlFor={`attachment-${patientId}`}>PDF or image</Label>
        <input
          id={`attachment-${patientId}`}
          name="attachment"
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          required
          className="block w-full text-xs file:mr-3 file:rounded-lg file:border file:border-border file:bg-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground"
        />
        <p className="text-[0.65rem] text-muted-foreground">
          Max 10 MB. Private bucket; only clinic users can request a signed URL.
        </p>
      </div>

      <Button size="sm" disabled={isPending} variant="outline">
        {isPending ? (
          <>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            Uploading…
          </>
        ) : (
          <>
            <Upload data-icon="inline-start" />
            Attach
          </>
        )}
      </Button>
    </form>
  );
}
