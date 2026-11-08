import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-6 py-16">
      <Logo />
      <div className="mt-10 w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 text-center shadow-soft">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Compass className="size-6" />
        </span>
        <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Page not found
        </p>
        <h1 className="mt-2 font-heading text-3xl tracking-tight">
          This page has wandered off.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The page you are looking for does not exist, or it may have moved.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/">
              <ArrowLeft data-icon="inline-start" />
              Back to the clinic
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Open dashboard</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
