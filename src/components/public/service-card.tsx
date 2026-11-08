import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Video } from "lucide-react";

import { formatPkr, type ClinicService } from "@/config/clinic";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: ClinicService;
  className?: string;
};

export function ServiceCard({ service, className }: ServiceCardProps) {
  const isOnline = service.mode === "online";
  const Icon = isOnline ? Video : MapPin;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <Icon className="size-5" />
        </span>
        <span className="rounded-full border border-border/80 bg-muted/60 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {isOnline ? "Online" : "In person"}
        </span>
      </div>

      <h3 className="mt-5 font-heading text-xl tracking-tight">{service.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
        {service.description}
      </p>

      <div className="mt-5 flex items-center gap-4 border-t border-border/70 pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          {service.durationMinutes} min
        </span>
        <span className="size-1 rounded-full bg-border" />
        <span>{formatPkr(service.feePkr)}</span>
      </div>

      <Link
        href="/book"
        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand-deep"
      >
        Request this consultation
        <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    </article>
  );
}
