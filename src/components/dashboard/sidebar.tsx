"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, CircleDot, ExternalLink, Settings2 } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { dashboardNavigation } from "@/config/navigation";
import type { SessionUser } from "@/lib/auth/types";
import { cn, initials } from "@/lib/utils";

type DashboardSidebarContentProps = {
  onNavigate?: () => void;
  className?: string;
  user?: SessionUser | null;
};

export function DashboardSidebarContent({
  onNavigate,
  className,
  user,
}: DashboardSidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex h-[4.5rem] shrink-0 items-center border-b border-sidebar-border px-5">
        <Logo href="/dashboard" />
      </div>

      <nav
        aria-label="Dashboard navigation"
        className="flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-5">
          {dashboardNavigation.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                          isActive &&
                            "bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-sidebar-foreground",
                            isActive && "text-brand",
                          )}
                        />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[0.62rem] font-semibold text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <span className="size-1.5 rounded-full bg-brand" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        <div className="rounded-xl border border-dashed border-sidebar-border bg-card/60 p-3">
          <div className="flex items-center gap-2">
            <CircleDot className="size-3.5 text-amber-600" />
            <p className="text-xs font-medium">AI receptionist</p>
          </div>
          <p className="mt-1 pl-5 text-[0.68rem] leading-4 text-muted-foreground">
            Not connected yet
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/60"
        >
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
              {user ? initials(user.fullName) : "N"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">
              {user?.fullName ?? "Clinic owner"}
            </p>
            <p className="truncate text-[0.65rem] text-muted-foreground">
              {user
                ? user.role === "doctor"
                  ? "Doctor account"
                  : "Staff account"
                : "Not signed in"}
            </p>
          </div>
          <Settings2 className="size-3.5 text-muted-foreground" />
        </Link>

        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="size-3" />
            View public website
          </span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}
