"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AiKnowledgeEntry } from "@/lib/ai/knowledge";

import {
  createKnowledgeEntryAction,
  updateKnowledgeEntryAction,
} from "./actions";
import { initialKnowledgeActionState } from "./action-state";

const selectClassName =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20";

const categoryLabels: Record<AiKnowledgeEntry["category"], string> = {
  hours: "Hours",
  services: "Services",
  fees: "Fees",
  policies: "Policies",
  faq: "FAQ",
};

type KnowledgeFormProps =
  | { mode: "create"; entry?: undefined }
  | { mode: "edit"; entry: AiKnowledgeEntry };

export function KnowledgeForm(props: KnowledgeFormProps) {
  const isEdit = props.mode === "edit";
  const entry = props.entry;
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    isEdit ? updateKnowledgeEntryAction : createKnowledgeEntryAction,
    initialKnowledgeActionState,
  );

  useEffect(() => {
    if (!isEdit && state.status === "success") {
      formRef.current?.reset();
    }
  }, [isEdit, state.status]);

  const errors = state.errors ?? {};

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {props.mode === "edit" && (
        <input type="hidden" name="id" value={props.entry.id} />
      )}

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      )}

      {state.status === "success" && state.message && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-emerald-600/20 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          {state.message}
        </p>
      )}

      <fieldset disabled={isPending} className="min-w-0 space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={entry?.title ?? ""}
              placeholder="e.g. Cancellation policy"
              required
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "title-error" : undefined}
            />
            {errors.title && (
              <p id="title-error" className="text-[0.7rem] text-destructive">
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              name="category"
              defaultValue={entry?.category ?? "faq"}
              className={selectClassName}
              aria-invalid={errors.category ? true : undefined}
              aria-describedby={
                errors.category ? "category-error" : undefined
              }
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p id="category-error" className="text-[0.7rem] text-destructive">
                {errors.category}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="content">Approved fact</Label>
          <Textarea
            id="content"
            name="content"
            rows={5}
            defaultValue={entry?.content ?? ""}
            placeholder="Write a short, factual answer. Do not add medical advice, diagnoses or promises."
            required
            maxLength={2000}
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? "content-error" : undefined}
          />
          {errors.content && (
            <p id="content-error" className="text-[0.7rem] text-destructive">
              {errors.content}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={entry?.isActive ?? true}
            className="mt-0.5 size-4 shrink-0 accent-brand"
          />
          <span>
            <span className="block font-medium">Available to the assistant</span>
            <span className="mt-0.5 block text-[0.68rem] leading-4 text-muted-foreground">
              Deactivate instead of deleting. Inactive entries stay out of the
              model prompt.
            </span>
          </span>
        </label>

        <div className="flex items-start gap-2 rounded-lg border border-brand/15 bg-brand-soft/40 px-3 py-2 text-[0.7rem] leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
          The assistant may use this text only as clinic policy or hospitality
          information. It is never a source of diagnosis or prescription.
        </div>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
              Saving…
            </>
          ) : (
            <>
              <Save data-icon="inline-start" />
              {isEdit ? "Save entry" : "Add entry"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
