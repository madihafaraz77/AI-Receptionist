import { Bot, Send, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const messages = [
  {
    from: "ai" as const,
    text: "Hello! I'm Nissa's AI receptionist. I can help with clinic hours, services and appointment requests. How can I help today?",
  },
  {
    from: "patient" as const,
    text: "I'd like to understand how online consultations work.",
  },
  {
    from: "ai" as const,
    text: "Online consultations are available Monday to Saturday. They follow the same 45-minute format as an in-person visit. I can help you request a time once live booking is connected.",
  },
];

export function AiChatPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lift">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
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
          <Sparkles className="size-3" />
          Preview
        </Badge>
      </div>

      <div className="space-y-4 bg-muted/25 px-5 py-6">
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.from === "patient"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <p
              className={
                message.from === "patient"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground"
                  : "max-w-[88%] rounded-2xl rounded-bl-md border border-border/70 bg-card px-4 py-2.5 text-sm leading-6 text-foreground shadow-sm"
              }
            >
              {message.text}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-border/70 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5">
          <span className="flex-1 text-sm text-muted-foreground">
            Chat will open when the AI receptionist launches
          </span>
          <Button size="icon-sm" disabled aria-label="Send message">
            <Send />
          </Button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-[0.7rem] leading-4 text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
          For clinic information and booking help only. It does not diagnose
          conditions, recommend medicines, or replace the doctor.
        </p>
      </div>
    </div>
  );
}
