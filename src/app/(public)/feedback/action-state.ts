/**
 * Public feedback Server Action state.
 *
 * A `"use server"` module may only export async functions, so the state type
 * and its initial value live here. Both the actions and the client form import
 * from this file.
 */
export type FeedbackSubmissionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialFeedbackSubmissionState: FeedbackSubmissionState = {
  status: "idle",
};
