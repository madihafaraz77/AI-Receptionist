import Link from "next/link";

import { Card } from "@/components/ui/card";
import { dashboardQuickActions } from "@/config/navigation";

export function QuickActionsCard() {
  return (
    <Card className="gap-0 py-0 shadow-soft ring-border/80">
      <div className="px-5 pt-5">
        <h3 className="font-heading text-lg tracking-tight">Quick actions</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Jump into a clinic workflow
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 px-5 pb-5 pt-4">
        {dashboardQuickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 text-xs font-medium transition-colors hover:border-brand/20 hover:bg-brand-soft/50"
          >
            <action.icon className="size-4 text-brand" />
            <span className="leading-4">{action.label}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
