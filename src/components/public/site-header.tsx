"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Clock3, Menu, Sparkles } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  clinicHoursLabelFor,
  workingWeekdaySummaryFor,
  type ClinicConfig,
} from "@/config/clinic";
import { publicNavigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader({ settings }: { settings: ClinicConfig }) {
  const pathname = usePathname();
  const weekdaySummary = workingWeekdaySummaryFor(settings.workingWeekdays);
  const hoursLabel = clinicHoursLabelFor(settings);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main navigation" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {publicNavigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
                      isActive && "text-foreground",
                    )}
                  >
                    {item.label}
                    {isActive && (
                      <span className="absolute inset-x-3.5 -bottom-[1.35rem] h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" asChild>
            <Link href="/ai-receptionist">
              <Sparkles data-icon="inline-start" />
              Ask Nissa AI
            </Link>
          </Button>
          <Button asChild>
            <Link href="/book">
              Book appointment
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm">
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">
                Links to Nissa Homeopathic Clinic pages
              </SheetDescription>
              <Logo />
            </SheetHeader>

            <nav aria-label="Mobile navigation" className="px-3">
              <ul className="flex flex-col gap-1">
                {publicNavigation.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <SheetClose asChild>
                        <Link
                          href={item.href}
                          aria-current={isActive ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                            isActive && "bg-muted/80 text-foreground",
                          )}
                        >
                          {item.label}
                          {isActive && (
                            <span className="size-1.5 rounded-full bg-primary" />
                          )}
                        </Link>
                      </SheetClose>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-auto space-y-3 border-t p-4">
              <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-brand" />
                <div>
                  <p className="font-medium text-foreground">
                    {weekdaySummary}
                  </p>
                  <p>{hoursLabel}</p>
                  <p className="mt-1 text-xs">
                    {settings.appointmentDurationMinutes}-minute
                    appointments
                  </p>
                </div>
              </div>
              <SheetClose asChild>
                <Button className="w-full" asChild>
                  <Link href="/book">
                    Book appointment
                    <ArrowUpRight data-icon="inline-end" />
                  </Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/ai-receptionist">Ask Nissa AI</Link>
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
