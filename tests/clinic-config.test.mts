import test from "node:test";
import assert from "node:assert/strict";

import {
  clinicConfig,
  defaultServices,
  formatClinicTime,
  formatPkr,
  workingWeekdayLabels,
  workingWeekdaySummary,
} from "../src/config/clinic.ts";

test("confirmed booking rules match the clinic agreement", () => {
  assert.equal(clinicConfig.appointmentDurationMinutes, 45);
  assert.equal(clinicConfig.dailyCapacity, 8);
  assert.equal(clinicConfig.openingTime, "11:00");
  assert.equal(clinicConfig.closingTime, "17:00");
  assert.equal(clinicConfig.bookingApproval, "automatic");
  assert.equal(clinicConfig.walkInsEnabled, false);
  assert.equal(clinicConfig.onlineConsultationEnabled, true);
  assert.equal(clinicConfig.consultationFeePkr, 500);
});

test("the clinic is open Monday to Saturday", () => {
  assert.deepEqual(clinicConfig.workingWeekdays, [1, 2, 3, 4, 5, 6]);
  assert.equal(workingWeekdaySummary, "Mon – Sat");
  assert.deepEqual(
    workingWeekdayLabels.map((day) => day.short),
    ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  );
});

test("unsupplied clinic details are never invented", () => {
  assert.equal(clinicConfig.address, null);
  assert.equal(clinicConfig.phone, null);
  assert.equal(clinicConfig.email, null);
  assert.equal(clinicConfig.doctorName, null);
  assert.equal(clinicConfig.timezone, null);
});

test("clinic times render in 12-hour format", () => {
  assert.equal(formatClinicTime("11:00"), "11:00 AM");
  assert.equal(formatClinicTime("17:00"), "5:00 PM");
  assert.equal(formatClinicTime("00:30"), "12:30 AM");
  assert.equal(formatClinicTime("12:00"), "12:00 PM");
});

test("fees render as Pakistani rupees", () => {
  assert.equal(formatPkr(500), "PKR 500");
});

test("the launch catalogue keeps the 45-minute format", () => {
  assert.equal(defaultServices.length, 3);
  assert.ok(defaultServices.every((service) => service.durationMinutes === 45));
  assert.ok(defaultServices.some((service) => service.mode === "in_person"));
  assert.ok(defaultServices.some((service) => service.mode === "online"));
});
