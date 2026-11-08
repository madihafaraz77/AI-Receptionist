import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { defaultServices, type ClinicService } from "@/config/clinic";
import {
  fallbackClinicSettings,
  mapClinicSettingsRow,
  mapServiceRow,
  toPublicService,
  type ClinicSettingsRow,
  type ServiceRow,
} from "@/lib/clinic/map";
import type { ClinicServiceRecord, ClinicSettings } from "@/lib/clinic/types";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Tag used to refresh public clinic content after a settings change. */
export const CLINIC_CONTENT_TAG = "clinic-content";

const SETTINGS_COLUMNS = [
  "name",
  "address",
  "phone",
  "email",
  "timezone",
  "doctor_name",
  "opening_time",
  "closing_time",
  "appointment_duration_minutes",
  "daily_capacity",
  "working_weekdays",
  "booking_approval",
  "walk_ins_enabled",
  "consultation_fee_pkr",
  "online_consultation_enabled",
  "follow_up_reminder_hours",
  "ai_escalation_channels",
  "notification_channels",
  "updated_at",
].join(", ");

const SERVICE_COLUMNS = [
  "id",
  "slug",
  "name",
  "description",
  "duration_minutes",
  "fee_pkr",
  "mode",
  "is_active",
  "sort_order",
  "updated_at",
].join(", ");

type SupabaseErrorLike = { code?: string; message?: string } | null;

function isMissingTable(error: SupabaseErrorLike): boolean {
  if (!error) return false;

  const message = error.message ?? "";

  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    /could not find the table|does not exist/i.test(message)
  );
}

function logQueryFailure(scope: string, error: { code?: string; message?: string }) {
  // Log server-side only. Raw database details never reach the browser.
  console.error(`[clinic] ${scope} query failed`, {
    code: error.code,
    message: error.message,
  });
}

export type DashboardSettingsResult =
  | { status: "ok"; settings: ClinicSettings }
  | { status: "needs_migration" }
  | { status: "error" }
  | { status: "unconfigured" };

/**
 * Reads the clinic settings for the dashboard using the signed-in session, so
 * Row Level Security applies. Unlike the public fallback, a missing row or an
 * error is surfaced honestly instead of being hidden.
 */
export async function getDashboardClinicSettings(): Promise<DashboardSettingsResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const { data, error } = await supabase
    .from("clinic_settings")
    .select(SETTINGS_COLUMNS)
    .eq("id", true)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return { status: "needs_migration" };
    logQueryFailure("settings", error);
    return { status: "error" };
  }

  if (!data) {
    // The singleton row is created by the seed migration. Without it, booking
    // validation cannot run either, so treat it as a migration problem.
    return { status: "needs_migration" };
  }

  return {
    status: "ok",
    settings: mapClinicSettingsRow(data as unknown as ClinicSettingsRow),
  };
}

export type DashboardServicesResult =
  | { status: "ok"; services: ClinicServiceRecord[] }
  | { status: "needs_migration" }
  | { status: "error" }
  | { status: "unconfigured" };

/**
 * Reads every service, active or archived, for the management screen. The
 * doctor policy allows this; staff receive no rows from RLS.
 */
export async function getDashboardServices(): Promise<DashboardServicesResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { status: "unconfigured" };
  }

  const { data, error } = await supabase
    .from("services")
    .select(SERVICE_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (isMissingTable(error)) return { status: "needs_migration" };
    logQueryFailure("services", error);
    return { status: "error" };
  }

  return {
    status: "ok",
    services: ((data ?? []) as unknown as ServiceRow[]).map(mapServiceRow),
  };
}

export type PublicClinicContent = {
  settings: ClinicSettings;
  services: ClinicService[];
  /** Where the values came from. Useful for honest diagnostics. */
  source: "database" | "fallback";
};

/**
 * Public clinic content for the marketing site.
 *
 * Cached and tagged so every public page shares one database read. Saving
 * settings or services in the dashboard calls `updateTag(CLINIC_CONTENT_TAG)`,
 * which refreshes all of these pages.
 *
 * When Supabase is not configured (or the query fails) the confirmed values in
 * `src/config/clinic.ts` are used instead. Nothing is invented.
 */
export async function getPublicClinicContent(): Promise<PublicClinicContent> {
  "use cache";
  cacheLife("hours");
  cacheTag(CLINIC_CONTENT_TAG);

  const fallback: PublicClinicContent = {
    settings: fallbackClinicSettings(),
    services: defaultServices,
    source: "fallback",
  };

  const supabase = createSupabasePublicClient();

  if (!supabase) {
    return fallback;
  }

  try {
    const [settingsResult, servicesResult] = await Promise.all([
      supabase
        .from("clinic_settings")
        .select(SETTINGS_COLUMNS)
        .eq("id", true)
        .maybeSingle(),
      supabase
        .from("services")
        .select(SERVICE_COLUMNS)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
    ]);

    if (settingsResult.error) {
      if (!isMissingTable(settingsResult.error)) {
        logQueryFailure("public settings", settingsResult.error);
      }
      return fallback;
    }

    if (servicesResult.error) {
      if (!isMissingTable(servicesResult.error)) {
        logQueryFailure("public services", servicesResult.error);
      }
      return fallback;
    }

    if (!settingsResult.data) {
      // The row is missing: keep the confirmed launch defaults rather than
      // rendering an empty website, and let the dashboard report the migration
      // problem.
      return fallback;
    }

    const services = ((servicesResult.data ?? []) as unknown as ServiceRow[]).map(
      (row) => toPublicService(mapServiceRow(row)),
    );

    return {
      settings: mapClinicSettingsRow(
        settingsResult.data as unknown as ClinicSettingsRow,
      ),
      services,
      source: "database",
    };
  } catch (error) {
    console.error("[clinic] public content query failed", error);
    return fallback;
  }
}
