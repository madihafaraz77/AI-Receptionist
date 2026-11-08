/**
 * Application-level flags.
 *
 * The dashboard now reads real Supabase data. There is no preview/sample mode:
 * when Supabase is not configured, the UI shows an explicit setup notice.
 */
export const appConfig = {
  name: "Nissa Clinic",
  version: "0.2.0",
  milestone: 2,
} as const;

export const CURRENT_MILESTONE_LABEL =
  "Milestone 2 · Supabase & authentication";
