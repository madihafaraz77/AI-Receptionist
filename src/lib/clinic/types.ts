import type { ClinicConfig, ClinicService } from "@/config/clinic";

/**
 * Clinic settings as the application uses them.
 *
 * `ClinicConfig` holds the confirmed launch defaults that also ship as a typed
 * fallback. From Milestone 3 onward the database row is the source of truth;
 * `updatedAt` lets the dashboard show when it was last saved.
 */
export type ClinicSettings = ClinicConfig & {
  updatedAt: string | null;
};

/** A service row that the doctor can manage in the dashboard. */
export type ClinicServiceRecord = ClinicService & {
  slug: string;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string | null;
};
