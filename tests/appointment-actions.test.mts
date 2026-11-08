import test from "node:test";
import assert from "node:assert/strict";

import { parseAppointmentActionForm } from "../src/lib/dashboard/validation.ts";

const appointmentId = "0f59a216-4b54-4f6f-86d4-9baa4a4a1018";

function form(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

test("confirm accepts a valid appointment id", () => {
  const result = parseAppointmentActionForm(
    form({ appointmentId, status: "confirmed" }),
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.cancellationReason, null);
});

test("complete accepts a valid appointment id", () => {
  const result = parseAppointmentActionForm(
    form({ appointmentId, status: "completed" }),
  );

  assert.equal(result.ok, true);
});

test("cancel requires a reason", () => {
  const result = parseAppointmentActionForm(
    form({ appointmentId, status: "cancelled" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.cancellationReason);
});

test("cancel accepts a concise reason", () => {
  const result = parseAppointmentActionForm(
    form({
      appointmentId,
      status: "cancelled",
      cancellationReason: "Patient asked to cancel.",
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.cancellationReason, "Patient asked to cancel.");
  }
});

test("unsupported actions are rejected", () => {
  const result = parseAppointmentActionForm(
    form({ appointmentId, status: "no_show" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.status);
});

test("appointment ids must be UUIDs", () => {
  const result = parseAppointmentActionForm(
    form({ appointmentId: "not-a-uuid", status: "confirmed" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.appointmentId);
});

test("cancellation reasons are bounded", () => {
  const result = parseAppointmentActionForm(
    form({
      appointmentId,
      status: "cancelled",
      cancellationReason: "x".repeat(501),
    }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.cancellationReason);
});
