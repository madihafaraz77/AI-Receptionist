/**
 * Dashboard feedback Server Action state.
 *
 * A `"use server"` module may only export async functions, so the state type
 * and its initial value live here. Both the actions and the status controls
 * import from this file.
 */
export type FeedbackActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialFeedbackActionState: FeedbackActionState = {
  status: "idle",
};
