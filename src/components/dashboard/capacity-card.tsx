import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { clinicConfig, clinicHoursLabel } from "@/config/clinic";
import { cn } from "@/lib/utils";

type CapacityCardProps = {
  used: number;
  total?: number;
  durationMinutes?: number;
};

export function CapacityCard({
  used,
  total = clinicConfig.dailyCapacity,
  durationMinutes = clinicConfig.appointmentDurationMinutes,
}: CapacityCardProps) {
  const safeTotal = Math.max(total, 1);
  const clampedUsed = Math.min(Math.max(used, 0), safeTotal);
  const remaining = safeTotal - clampedUsed;
  const percent = Math.round((clampedUsed / safeTotal) * 100);

  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <h3 className="font-heading text-lg tracking-tight">Daily capacity</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Confirmed active appointments
          </p>
        </div>
        <Badge variant="outline" className="text-[0.65rem]">
          Live
        </Badge>
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <p className="font-heading text-3xl font-medium leading-none tracking-tight">
            {clampedUsed}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              / {safeTotal}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {remaining} slot{remaining === 1 ? "" : "s"} remaining
          </p>
        </div>

        <div
          className="mt-4 flex gap-1.5"
          role="progressbar"
          aria-label="Daily appointment capacity used"
          aria-valuemin={0}
          aria-valuemax={safeTotal}
          aria-valuenow={clampedUsed}
        >
          {Array.from({ length: safeTotal }).map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 flex-1 rounded-full",
                index < clampedUsed ? "bg-brand" : "bg-muted",
              )}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[0.68rem] text-muted-foreground">
          <span>{percent}% used</span>
          <span>
            {durationMinutes} min · {clinicHoursLabel}
          </span>
        </div>

        <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2.5 text-[0.68rem] leading-5 text-muted-foreground">
          Capacity will be enforced atomically by the clinic backend.
          Cancellations release their slot.
        </p>
      </div>
    </Card>
  );
}
