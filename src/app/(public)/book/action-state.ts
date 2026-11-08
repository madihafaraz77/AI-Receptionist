/**
 * Public booking Server Action state.
 *
 * A `"use server"` module may only export async functions, so these types and
 * their initial values live here. Both the actions and the booking form import
 * from this file.
 */
import type { FieldErrors } from "@/lib/booking/validation";

export type Slot = {
  /** 24-hour time, safe to post back as "startTime". */
  time: string;
  /** Display label in clinic-friendly 12-hour format. */
  label: string;
};

export type SlotState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
  slots?: Slot[];
  /** The exact selection that produced these slots. */
  selection?: {
    serviceId: string;
    appointmentDate: string;
  };
};

export const initialSlotState: SlotState = { status: "idle" };

export type BookingState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
  appointment?: {
    reference: string;
    status: "confirmed" | "pending";
    appointmentDate: string;
    startTime: string;
    mode: "in_person" | "online";
    feePkr: number;
  };
};

export const initialBookingState: BookingState = { status: "idle" };
