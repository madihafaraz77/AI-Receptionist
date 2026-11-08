import test from "node:test";
import assert from "node:assert/strict";

import {
  clinicHoursLabelFor,
  workingWeekdaySummaryFor,
} from "../src/config/clinic.ts";
import {
  isValidTimeZone,
  parseClinicSettingsForm,
  parseServiceForm,
} from "../src/lib/clinic/validation.ts";

function settingsForm(overrides: Record<string, string | string[]> = {}) {
  const form = new FormData();

  const base: Record<string, string | string[]> = {
    name: "Nissa Homeopathic Clinic",
    doctorName: "",
    address: "",
    phone: "+92 300 1234567",
    email: "clinic@example.com",
    timezone: "Asia/Karachi",
    openingTime: "11:00",
    closingTime: "17:00",
    appointmentDurationMinutes: "45",
    dailyCapacity: "8",
    workingWeekdays: ["1", "2", "3", "4", "5", "6"],
    bookingApproval: "automatic",
    consultationFeePkr: "500",
    followUpReminderHours: "24",
    onlineConsultationEnabled: "on",
    ...overrides,
  };

  for (const [key, value] of Object.entries(base)) {
    if (Array.isArray(value)) {
      for (const item of value) form.append(key, item);
    } else {
      form.set(key, value);
    }
  }

  return form;
}

function serviceForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  const base: Record<string, string> = {
    name: "Follow-up Consultation",
    slug: "follow-up-consultation",
    description:
      "A review appointment for existing patients to discuss progress and next steps.",
    durationMinutes: "45",
    feePkr: "500",
    mode: "in_person",
    sortOrder: "10",
    isActive: "on",
    ...overrides,
  };

  for (const [key, value] of Object.entries(base)) {
    form.set(key, value);
  }

  return form;
}

test("a complete clinic settings form is accepted", () => {
  const result = parseClinicSettingsForm(settingsForm());

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.name, "Nissa Homeopathic Clinic");
  assert.equal(result.data.workingWeekdays.length, 6);
  assert.deepEqual(result.data.workingWeekdays, [1, 2, 3, 4, 5, 6]);
  assert.equal(result.data.address, null);
  assert.equal(result.data.doctorName, null);
  assert.equal(result.data.walkInsEnabled, false);
  assert.equal(result.data.onlineConsultationEnabled, true);
});

test("clinic settings reject a closing time before opening", () => {
  const result = parseClinicSettingsForm(
    settingsForm({ openingTime: "17:00", closingTime: "11:00" }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.match(result.errors.closingTime ?? "", /after opening time/);
});

test("clinic settings require at least one working day", () => {
  const result = parseClinicSettingsForm(
    settingsForm({ workingWeekdays: [] }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.match(result.errors.workingWeekdays ?? "", /at least one/);
});

test("clinic settings reject impossible values", () => {
  const result = parseClinicSettingsForm(
    settingsForm({
      email: "not-an-email",
      phone: "call me",
      timezone: "Mars/Olympus",
      dailyCapacity: "0",
      appointmentDurationMinutes: "500",
      consultationFeePkr: "-10",
      followUpReminderHours: "0",
      bookingApproval: "sometimes",
    }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  for (const field of [
    "email",
    "phone",
    "timezone",
    "dailyCapacity",
    "appointmentDurationMinutes",
    "consultationFeePkr",
    "followUpReminderHours",
    "bookingApproval",
  ]) {
    assert.ok(result.errors[field], `${field} should have an error`);
  }
});

test("appointment length cannot exceed the opening window", () => {
  const result = parseClinicSettingsForm(
    settingsForm({
      openingTime: "11:00",
      closingTime: "12:00",
      appointmentDurationMinutes: "120",
    }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.match(result.errors.appointmentDurationMinutes ?? "", /longer than/);
});

test("a complete service form is accepted", () => {
  const result = parseServiceForm(serviceForm());

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.slug, "follow-up-consultation");
  assert.equal(result.data.mode, "in_person");
  assert.equal(result.data.isActive, true);
  assert.equal(result.data.sortOrder, 10);
});

test("service slugs are lowercased and validated", () => {
  const ok = parseServiceForm(serviceForm({ slug: "Online-Consultation" }));

  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.data.slug, "online-consultation");

  const invalid = parseServiceForm(serviceForm({ slug: "Not A Slug!" }));
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.ok(invalid.errors.slug);
});

test("service description must be factual length and wording is bounded", () => {
  const result = parseServiceForm(serviceForm({ description: "Short" }));

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.ok(result.errors.description);
});

test("service fee, duration and sort order are range checked", () => {
  const result = parseServiceForm(
    serviceForm({ feePkr: "-1", durationMinutes: "0", sortOrder: "1000" }),
  );

  assert.equal(result.ok, false);
  if (result.ok) return;

  assert.ok(result.errors.feePkr);
  assert.ok(result.errors.durationMinutes);
  assert.ok(result.errors.sortOrder);
});

test("timezone validation accepts IANA names only", () => {
  assert.equal(isValidTimeZone("Asia/Karachi"), true);
  assert.equal(isValidTimeZone("Europe/London"), true);
  assert.equal(isValidTimeZone("Mars/Olympus"), false);
  assert.equal(isValidTimeZone(""), false);
});

test("working day summaries handle every shape", () => {
  assert.equal(workingWeekdaySummaryFor([]), "No working days configured");
  assert.equal(
    workingWeekdaySummaryFor([1, 2, 3, 4, 5, 6, 7]),
    "Every day",
  );
  assert.equal(workingWeekdaySummaryFor([3]), "Wed");
  assert.equal(workingWeekdaySummaryFor([1, 2, 3]), "Mon – Wed");
  assert.equal(workingWeekdaySummaryFor([1, 3, 5]), "Mon, Wed, Fri");
});

test("clinic hours render from arbitrary settings", () => {
  assert.equal(
    clinicHoursLabelFor({ openingTime: "09:30", closingTime: "13:00" }),
    "9:30 AM – 1:00 PM",
  );
});
