/**
 * Patient Server Action state.
 *
 * A `"use server"` module may only export async functions, so the state type
 * and its initial value live here. Both the actions and the client forms
 * import from this file.
 */
export type PatientActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialPatientActionState: PatientActionState = { status: "idle" };
