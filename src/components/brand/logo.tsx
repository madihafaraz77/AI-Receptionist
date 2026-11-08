import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: Route;
  className?: string;
  /** Hide the wordmark and show only the monogram. */
  compact?: boolean;
  /** Use light text, for dark backgrounds. */
  tone?: "default" | "inverse";
};

export function Logo({
  href = "/",
  className,
  compact = false,
  tone = "default",
}: LogoProps) {
  return (
    <Link
      href={href}
      aria-label="Nissa Homeopathic Clinic home"
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      <span
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] bg-primary text-primary-foreground shadow-soft transition-transform duration-200 group-hover:-translate-y-0.5",
          tone === "inverse" && "bg-primary-foreground/10 text-primary-foreground",
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          className="size-6"
        >
          <path
            d="M9 23V9l14 14V9"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22.5 8.5c2.4-.9 4.1-.6 5 .1-.4 2.1-1.7 3.6-4.2 4.1-1.4.3-2.4.1-2.9-.3.3-1.5 1-2.7 2.1-3.9Z"
            fill="currentColor"
            opacity=".85"
          />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col">
          <span
            className={cn(
              "font-heading text-[1.35rem] font-medium leading-none tracking-tight",
              tone === "inverse" && "text-primary-foreground",
            )}
          >
            Nissa
          </span>
          <span
            className={cn(
              "mt-1 text-[0.58rem] font-semibold uppercase leading-none tracking-[0.2em] text-muted-foreground",
              tone === "inverse" && "text-primary-foreground/60",
            )}
          >
            Homeopathic Clinic
          </span>
        </span>
      )}
    </Link>
  );
}
