import Link from "next/link";
import { AlertTriangle, Database, RefreshCw, Terminal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DatabaseSetupNotice() {
  return (
    <Card className="mx-auto max-w-2xl gap-0 overflow-hidden py-0 shadow-soft ring-border/80">
      <div className="border-b border-border/70 bg-amber-50/70 px-6 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Database className="size-4" />
        </span>
        <h2 className="mt-3 font-heading text-2xl tracking-tight">
          Database tables are not ready
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          The Supabase project is connected, but the schema has not been applied
          yet. The dashboard will not show or invent any records until the
          migrations run.
        </p>
      </div>

      <div className="space-y-3 px-6 py-5 text-sm">
        <p className="font-medium">Run the migrations</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-xs leading-5 text-muted-foreground">
          <li>
            Open the Supabase dashboard → SQL Editor, or install the Supabase
            CLI.
          </li>
          <li>
            Apply every file in <code>supabase/migrations/</code> in filename
            order.
          </li>
          <li>Reload this page.</li>
        </ol>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2.5 font-mono text-[0.68rem] text-muted-foreground">
          <Terminal className="size-3.5 shrink-0" />
          supabase db push
        </div>
      </div>

      <p className="border-t border-border/70 bg-muted/25 px-6 py-3 text-[0.68rem] leading-5 text-muted-foreground">
        See <code>supabase/README.md</code> for the full setup and doctor
        account steps.
      </p>
    </Card>
  );
}

export function DataErrorNotice() {
  return (
    <Card className="mx-auto max-w-2xl gap-0 overflow-hidden py-0 shadow-soft ring-border/80">
      <div className="px-6 py-6 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700">
          <AlertTriangle className="size-5" />
        </span>
        <h2 className="mt-3 font-heading text-2xl tracking-tight">
          The dashboard could not load
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
          Supabase returned an unexpected error. Check the server logs for the
          exact query, verify the environment variables, and try again.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/dashboard">
            <RefreshCw data-icon="inline-start" />
            Try again
          </Link>
        </Button>
      </div>
    </Card>
  );
}
