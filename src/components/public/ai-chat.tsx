"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  LoaderCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  askAiReceptionist,
  type AiChatMessage,
} from "@/app/(public)/ai-receptionist/actions";

type ChatStatus = "idle" | "sending" | "error";

const MAX_MESSAGE = 500;

export function AiChat({
  configured,
  loggingReady,
}: {
  configured: boolean;
  loggingReady: boolean;
}) {
  const initialMessage: AiChatMessage = configured
    ? {
        role: "assistant",
        content:
          "Hello! I’m Nissa’s administrative AI receptionist. I can help with clinic hours, services, fees and policies. I can’t diagnose or prescribe. How can I help today?",
      }
    : {
        role: "assistant",
        content:
          "The AI receptionist is not connected yet. The clinic must configure an OpenAI API key and model on the server before this chat can answer questions.",
      };

  const [messages, setMessages] = useState<AiChatMessage[]>([initialMessage]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [logging, setLogging] = useState<"unknown" | "saved" | "not_recorded">(
    "unknown",
  );
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    const message = input.trim();

    if (!message || message.length > MAX_MESSAGE || status === "sending") {
      return;
    }

    setStatus("sending");
    setError(null);

    const result = await askAiReceptionist({
      message,
      history: messages,
      conversationId,
    });
    setConversationId(result.conversationId);
    setLogging(result.logging);

    if (result.messages.length > 0) {
      setMessages(result.messages);
    } else {
      setMessages((current) => [
        ...current,
        { role: "user", content: message },
        { role: "assistant", content: "The AI service could not respond." },
      ]);
    }

    if (result.status === "error") {
      setStatus("error");
      setError(result.message);
    } else {
      setStatus("idle");
    }

    setInput("");
    form.reset();
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lift">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="size-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Nissa AI receptionist</p>
            <p className="text-xs text-muted-foreground">
              Administrative help · English
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 text-[0.68rem]">
          {configured ? (
            <>
              <Sparkles className="size-3" />
              Connected
            </>
          ) : (
            "Not connected"
          )}
        </Badge>
      </div>

      <div
        ref={scrollRef}
        aria-live="polite"
        className="max-h-96 space-y-4 overflow-y-auto bg-muted/25 px-5 py-6 sm:max-h-[28rem]"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <p
              className={cn(
                "max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6",
                message.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border border-border/70 bg-card text-foreground shadow-sm",
              )}
            >
              {message.content}
            </p>
          </div>
        ))}

        {status === "sending" && (
          <div role="status" className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            The AI receptionist is thinking…
          </div>
        )}
      </div>

      {!loggingReady && (
        <p className="border-t border-border/70 bg-amber-50/70 px-5 py-2 text-[0.68rem] leading-4 text-amber-900">
          This conversation is not being saved because the server-side Supabase
          secret key is not configured. The assistant can still answer when its
          OpenAI key is configured.
        </p>
      )}

      <form onSubmit={handleSubmit} className="border-t border-border/70 p-4">
        {logging === "not_recorded" && (
          <p
            role="status"
            className="mb-3 rounded-lg border border-amber-600/20 bg-amber-50 px-3 py-2 text-xs text-amber-900"
          >
            This answer was not saved to the clinic review inbox.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        )}

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <label htmlFor="ai-message" className="sr-only">
              Message for the AI receptionist
            </label>
            <input
              id="ai-message"
              name="message"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={MAX_MESSAGE}
              placeholder={
                configured
                  ? "Ask about hours, services, fees or booking…"
                  : "The assistant is not connected yet"
              }
              disabled={!configured || status === "sending"}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="text-right text-[0.65rem] tabular-nums text-muted-foreground">
              {input.length}/{MAX_MESSAGE}
            </p>
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!configured || status === "sending" || input.trim().length === 0}
            aria-label="Send message"
          >
            {status === "sending" ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Send />
            )}
          </Button>
        </div>

        <p className="mt-3 flex items-start gap-2 text-[0.7rem] leading-4 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
          Clinic information and booking help only. It does not diagnose,
          recommend or replace the doctor. Booking always goes through /book.
        </p>
      </form>
    </div>
  );
}
