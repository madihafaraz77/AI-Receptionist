import test from "node:test";
import assert from "node:assert/strict";

import {
  isCalendarDate,
  normalizePhone,
  parseBookingDetailsForm,
  parseSlotRequestForm,
} from "../src/lib/booking/validation.ts";

const serviceId = "0f59a216-4b54-4f6f-86d4-9baa4a4a1018";

function form(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

test("a booking request parses valid details", () => {
  const result = parseBookingDetailsForm(
    form({
      serviceId,
      appointmentDate: "2026-11-20",
      startTime: "11:00",
      fullName: "Patient Name",
      phone: "+92 300 1234567",
      email: "patient@example.com",
      notes: "Prefers in-person",
    }),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.serviceId, serviceId);
  assert.equal(result.data.appointmentDate, "2026-11-20");
  assert.equal(result.data.startTime, "11:00");
  assert.equal(result.data.email, "patient@example.com");
  assert.equal(result.data.notes, "Prefers in-person");
});

test("a booking request accepts an omitted email and notes", () => {
  const result = parseBookingDetailsForm(
    form({
      serviceId,
      appointmentDate: "2026-11-20",
      startTime: "11:45",
      fullName: "Patient Name",
      phone: "03001234567",
    }),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.email, null);
  assert.equal(result.data.notes, null);
});

test("a booking request rejects unsafe or impossible details", () => {
  const result = parseBookingDetailsForm(
    form({
      serviceId: "not-a-uuid",
      appointmentDate: "2026-02-30",
      startTime: "25:00",
      fullName: "",
      phone: "not a phone",
      email: "not-an-email",
      notes: "x".repeat(501),
    }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  for (const field of [
    "serviceId",
    "appointmentDate",
    "startTime",
    "fullName",
    "phone",
    "email",
    "notes",
  ]) {
    assert.ok(result.errors[field], `${field} should have an error`);
  }
});

test("slot request accepts a service and valid date", () => {
  const result = parseSlotRequestForm(
    form({ serviceId, appointmentDate: "2026-11-20" }),
  );

  assert.equal(result.ok, true);
});

test("slot request rejects broken UUIDs and dates", () => {
  const result = parseSlotRequestForm(
    form({ serviceId: "bad", appointmentDate: "20/11/2026" }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.ok(result.errors.serviceId);
  assert.ok(result.errors.appointmentDate);
});

test("calendar date validation handles leap years", () => {
  assert.equal(isCalendarDate("2028-02-29"), true);
  assert.equal(isCalendarDate("2027-02-29"), false);
  assert.equal(isCalendarDate("2026-04-31"), false);
});

test("phone numbers normalize to digits only", () => {
  assert.equal(normalizePhone("+92 (300) 123-4567"), "923001234567");
  assert.equal(normalizePhone("0300 123 4567"), "03001234567");
});
