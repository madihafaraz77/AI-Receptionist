"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ExternalLink,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings2,
} from "lucide-react";

import { signOutAction } from "@/app/dashboard/actions";
import { DashboardSidebarContent } from "@/components/dashboard/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { appConfig } from "@/config/app";
import { dashboardNavigation } from "@/config/navigation";
import type { SessionUser } from "@/lib/auth/types";
import { initials } from "@/lib/utils";

const allNavItems = dashboardNavigation.flatMap((group) => group.items);

type DashboardTopbarProps = {
  user: SessionUser | null;
  configured: boolean;
};

export function DashboardTopbar({ user, configured }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentItem = allNavItems
    .filter(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  const title = currentItem?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-[4.5rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Open dashboard navigation"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[18rem] gap-0 p-0"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Dashboard navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Navigate between clinic management modules
            </SheetDescription>
            <DashboardSidebarContent
              user={user}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
            {appConfig.name} · Doctor dashboard
          </p>
          <h1 className="truncate font-heading text-xl font-medium tracking-tight">
            {title}
          </h1>
        </div>

        <div className="hidden items-center md:flex">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/patients">
              <Search className="size-3.5" data-icon="inline-start" />
              Patients
            </Link>
          </Button>
        </div>

        {!configured && (
          <Badge
            variant="outline"
            className="hidden gap-1.5 border-amber-600/20 bg-amber-50 text-amber-800 sm:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-amber-500" />
            Setup required
          </Badge>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative"
              aria-label="Recent notifications"
            >
              <Link href="/dashboard">
                <Bell />
                <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-brand ring-2 ring-background" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Recent notifications are on the overview</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Open account menu"
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-brand-soft text-xs font-semibold text-brand">
                  {user ? initials(user.fullName) : "N"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <span className="block truncate text-sm">
                {user?.fullName ?? "Setup required"}
              </span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {user
                  ? `${user.email} · ${user.role === "doctor" ? "Doctor" : "Staff"}`
                  : "Supabase is not connected yet"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings2 />
                Clinic settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/">
                <ExternalLink />
                Public website
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user ? (
              <form action={signOutAction}>
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <LogOut />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            ) : (
              <DropdownMenuItem asChild>
                <Link href="/login">
                  <LogIn />
                  Sign in
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
