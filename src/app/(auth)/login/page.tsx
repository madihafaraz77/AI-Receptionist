import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Doctor sign in" };

// This page reads the session and URL, so it renders per request.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return <SupabaseSetupNotice />;
  }

  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const next = params.next?.startsWith("/dashboard")
    ? params.next
    : "/dashboard";

  return (
    <Card className="w-full max-w-md gap-0 overflow-hidden py-0 shadow-lift ring-border/80">
      <div className="border-b border-border/70 px-6 py-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">
          Doctor dashboard
        </p>
        <h1 className="mt-1 font-heading text-2xl tracking-tight">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          Sign in to manage appointments, patients and clinic settings.
        </p>
      </div>

      <div className="px-6 py-5">
        {params.error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-amber-600/20 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800"
          >
            {params.error === "not_authorised"
              ? "This account does not have clinic access."
              : "Please sign in to continue."}
          </p>
        )}

        <LoginForm next={next} />
      </div>

      <p className="flex items-start gap-2 border-t border-border/70 bg-muted/25 px-6 py-3 text-[0.68rem] leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
        Accounts are created by invitation. There is no public sign-up.
      </p>
    </Card>
  );
}
