import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  Mail,
  MessageCircle,
  MessageSquareText,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  DashboardConversation,
  DashboardNotification,
  NotificationStatus,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type AiAttentionCardProps = {
  conversations: DashboardConversation[];
  pendingFeedback: number;
};

export function AiAttentionCard({
  conversations,
  pendingFeedback,
}: AiAttentionCardProps) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex items-start justify-between gap-3 border-b border-border/70 px-5 py-4">
        <div className="flex items-center gap-2">
          <Bot className="size-4 text-brand" />
          <div>
            <h3 className="font-heading text-lg tracking-tight">
              Needs attention
            </h3>
            <p className="text-xs text-muted-foreground">
              AI conversations and feedback
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="border-amber-600/20 bg-amber-50 text-[0.62rem] text-amber-700"
        >
          {conversations.length + pendingFeedback} waiting
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        {conversations.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No conversations need a human right now.
          </p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="rounded-xl border border-border/70 bg-card p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{conversation.patientName}</p>
                <Badge
                  variant="outline"
                  className="border-amber-600/20 bg-amber-50 text-[0.6rem] text-amber-700"
                >
                  Needs human
                </Badge>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {conversation.summary}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[0.65rem] text-muted-foreground">
                  {conversation.lastMessageAt}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/ai-receptionist">
                    Open
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}

        <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 px-3.5 py-3">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Pending feedback
            </span>
          </div>
          <span className="text-sm font-semibold">{pendingFeedback}</span>
        </div>
      </div>

      <p className="border-t border-border/70 bg-muted/25 px-5 py-2.5 text-[0.68rem] leading-5 text-muted-foreground">
        AI conversations are not live yet. This card shows the planned handover
        view.
      </p>
    </Card>
  );
}

const channelMeta = {
  dashboard: { label: "Dashboard", icon: Bell },
  email: { label: "Email", icon: Mail },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
} as const;

const deliveryStyles: Record<
  NotificationStatus,
  { label: string; className: string }
> = {
  delivered: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700",
  },
  sent: { label: "Sent", className: "bg-sky-50 text-sky-700" },
  queued: { label: "Queued", className: "bg-amber-50 text-amber-700" },
  failed: { label: "Failed", className: "bg-rose-50 text-rose-700" },
  not_connected: {
    label: "Not connected",
    className: "bg-rose-50 text-rose-700",
  },
};

export function NotificationsCard({
  notifications,
}: {
  notifications: DashboardNotification[];
}) {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="border-b border-border/70 px-5 py-4">
        <h3 className="font-heading text-lg tracking-tight">
          Recent notifications
        </h3>
        <p className="text-xs text-muted-foreground">
          Dashboard alerts are the primary record
        </p>
      </div>

      {notifications.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          No notifications yet.
        </p>
      ) : (
        <ul className="divide-y divide-border/70">
          {notifications.map((notification) => {
            const meta = channelMeta[notification.channel];
            const status = deliveryStyles[notification.status];
            const ChannelIcon = meta.icon;

            return (
              <li key={notification.id} className="flex gap-3 px-5 py-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <ChannelIcon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 truncate text-[0.68rem] text-muted-foreground">
                    {notification.detail}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[0.6rem] font-medium",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                    <span className="text-[0.62rem] text-muted-foreground">
                      {meta.label} · {notification.timeLabel}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="border-t border-border/70 bg-muted/25 px-5 py-2.5 text-[0.68rem] leading-5 text-muted-foreground">
        Email and WhatsApp providers are not configured. In-app alerts are
        stored in the database.
      </p>
    </Card>
  );
}
