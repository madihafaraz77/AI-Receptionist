/**
 * Clinic service Server Action state.
 *
 * A `"use server"` module may only export async functions, so the state type
 * and its initial value live here. Both the actions and the client form import
 * from this file.
 */
import type { FieldErrors } from "@/lib/clinic/validation";

export type ServiceActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

export const initialServiceState: ServiceActionState = { status: "idle" };
