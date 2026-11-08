/**
 * Follow-up Server Action state.
 *
 * A `"use server"` module may only export async functions, so the state type
 * and its initial value live here. Both the actions and the status controls
 * import from this file.
 */
import type { FieldErrors } from "@/lib/dashboard/validation";

export type FollowUpActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialFollowUpActionState: FollowUpActionState = {
  status: "idle",
};
