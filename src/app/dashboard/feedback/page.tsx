import type { Metadata } from "next";
import { Star } from "lucide-react";

import {
  DatabaseSetupNotice,
  DataErrorNotice,
} from "@/components/dashboard/data-state";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { FeedbackControls } from "./feedback-controls";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireClinicUser } from "@/lib/auth/session";
import { getFeedback } from "@/lib/feedback/data";

export const metadata: Metadata = { title: "Patient Feedback" };

export const instant = false;

export default async function DashboardFeedbackPage() {
  await requireClinicUser();
  const result = await getFeedback();

  if (result.status === "unconfigured") {
    return <SupabaseSetupNotice />;
  }

  if (result.status === "needs_migration") {
    return <DatabaseSetupNotice />;
  }

  if (result.status === "error") {
    return <DataErrorNotice />;
  }

  const newCount = result.items.filter((item) => item.status === "new").length;
  const average =
    result.items.length === 0
      ? 0
      : result.items.reduce((sum, item) => sum + item.rating, 0) /
        result.items.length;

  return (
    <div className="space-y-5">
      <DashboardPageHeader
        title="Patient feedback"
        description="Private reviews submitted through the public feedback form."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="New feedback"
          value={newCount}
          helper="Unreviewed submissions"
          icon={Star}
        />
        <StatCard
          label="Average rating"
          value={average.toFixed(1)}
          helper={`${result.items.length} submissions in total`}
          icon={Star}
        />
      </div>

      {result.items.length === 0 ? (
        <Card className="gap-0 py-16 text-center shadow-soft ring-border/80">
          <Star className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-3 font-heading text-2xl tracking-tight">
            No feedback yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Patient submissions appear here after the public feedback form is submitted.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {result.items.map((item) => (
            <Card key={item.id} className="gap-0 overflow-hidden py-0 shadow-soft ring-border/80">
              <div className="px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1" aria-label={`${item.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={
                          index < item.rating
                            ? "size-4 fill-amber-400 text-amber-400"
                            : "size-4 text-muted-foreground/30"
                        }
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.status}</Badge>
                    <span className="text-[0.68rem] text-muted-foreground">
                      {item.createdAtLabel}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  {item.comment || "No comment provided."}
                </p>
                {item.response && (
                  <p className="mt-3 border-l-2 border-brand/30 pl-3 text-xs leading-6 text-muted-foreground">
                    Clinic response: {item.response}
                  </p>
                )}
              </div>
              <FeedbackControls id={item.id} status={item.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
