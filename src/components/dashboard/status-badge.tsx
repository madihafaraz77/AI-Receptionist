import { Bot, Globe2, MapPin, UserRound, Video } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type {
  AppointmentStatus,
  AppointmentType,
  BookingSource,
} from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<AppointmentStatus, string> = {
  pending:
    "border-amber-600/20 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  confirmed:
    "border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  completed:
    "border-sky-600/20 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  cancelled:
    "border-rose-600/20 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  no_show:
    "border-amber-600/20 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  rescheduled:
    "border-violet-600/20 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
  rescheduled: "Rescheduled",
};

export function AppointmentStatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", statusStyles[status], className)}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {statusLabels[status]}
    </Badge>
  );
}

export function AppointmentTypeBadge({
  type,
  className,
}: {
  type: AppointmentType;
  className?: string;
}) {
  const Icon = type === "online" ? Video : MapPin;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {type === "online" ? "Online" : "In person"}
    </span>
  );
}

const sourceMeta: Record<
  BookingSource,
  { label: string; icon: typeof Globe2 }
> = {
  website: { label: "Website", icon: Globe2 },
  ai_receptionist: { label: "AI receptionist", icon: Bot },
  staff: { label: "Staff", icon: UserRound },
};

export function BookingSourceLabel({ source }: { source: BookingSource }) {
  const meta = sourceMeta[source];
  const Icon = meta.icon;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      {meta.label}
    </span>
  );
}
