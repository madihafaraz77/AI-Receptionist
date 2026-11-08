import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Doctor sign in",
  description: "Sign in to the Nissa Homeopathic Clinic dashboard.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-muted/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-[-10rem] size-[28rem] rounded-full bg-brand-soft/70 blur-3xl" />
        <div className="absolute -right-24 bottom-[-12rem] size-[30rem] rounded-full bg-accent/50 blur-3xl" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to website
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
        {children}
      </main>

      <footer className="relative z-10 px-5 py-5 text-center text-[0.68rem] text-muted-foreground sm:px-8">
        Authorised clinic users only. Patient data is protected by row-level
        security.
      </footer>
    </div>
  );
}
