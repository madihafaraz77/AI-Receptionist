import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  className?: string;
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "gap-0 py-5 shadow-soft ring-border/80 transition-shadow hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 px-5">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-medium leading-none tracking-tight">
            {value}
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-3 px-5 text-xs text-muted-foreground">{helper}</p>
    </Card>
  );
}
