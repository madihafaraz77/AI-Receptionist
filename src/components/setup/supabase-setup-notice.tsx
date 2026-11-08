import { Database, KeyRound, Terminal } from "lucide-react";

import { Card } from "@/components/ui/card";

const steps = [
  {
    icon: Database,
    title: "Create the Supabase project",
    body: "Create a project at supabase.com, then copy the Project URL and publishable key from the Connect dialog (or Settings → API Keys).",
  },
  {
    icon: KeyRound,
    title: "Add the environment variables",
    body: "Put NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local. Add SUPABASE_SECRET_KEY for server-only workflows, then restart the app.",
  },
  {
    icon: Terminal,
    title: "Run the database migrations",
    body: "Apply the SQL files in supabase/migrations/ (SQL editor or Supabase CLI). They create the tables, RLS policies, storage bucket and seed data.",
  },
];

export function SupabaseSetupNotice() {
  return (
    <Card className="mx-auto max-w-2xl gap-0 overflow-hidden py-0 shadow-soft ring-border/80">
      <div className="border-b border-border/70 bg-brand-soft/40 px-6 py-5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand">
          Milestone 2 setup
        </p>
        <h2 className="mt-1 font-heading text-2xl tracking-tight">
          Connect Supabase to continue
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          The dashboard is now wired to real data. Until the project keys are
          added, no patient or clinic records are loaded — nothing is simulated.
        </p>
      </div>

      <ol className="divide-y divide-border/70">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="flex gap-4 px-6 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium">
                  {index + 1}. {step.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="border-t border-border/70 bg-muted/25 px-6 py-3 text-[0.68rem] leading-5 text-muted-foreground">
        Full instructions are in <code>supabase/README.md</code>. Never commit
        <code className="mx-1 rounded bg-background px-1 py-0.5">.env.local</code>
        or the service-role key.
      </p>
    </Card>
  );
}
