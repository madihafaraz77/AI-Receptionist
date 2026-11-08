import test from "node:test";
import assert from "node:assert/strict";

import {
  addDaysToDateKey,
  formatDateKey,
  formatDueLabel,
  formatRelativeTime,
  formatTimeInZone,
} from "../src/lib/dashboard/date.ts";

test("addDaysToDateKey moves across month and year boundaries", () => {
  assert.equal(addDaysToDateKey("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysToDateKey("2026-01-01", -1), "2025-12-31");
  assert.equal(addDaysToDateKey("2026-11-07", 7), "2026-11-14");
});

test("addDaysToDateKey respects leap years", () => {
  assert.equal(addDaysToDateKey("2028-02-28", 1), "2028-02-29");
  assert.equal(addDaysToDateKey("2027-02-28", 1), "2027-03-01");
});

test("formatDateKey uses the requested timezone", () => {
  const instant = new Date("2026-11-07T20:00:00Z");

  assert.equal(formatDateKey(instant, "UTC"), "2026-11-07");
  assert.equal(formatDateKey(instant, "Asia/Karachi"), "2026-11-08");
});

test("formatTimeInZone renders a 12-hour clinic time", () => {
  assert.equal(formatTimeInZone("2026-11-07T06:00:00Z", "Asia/Karachi"), "11:00 AM");
  assert.equal(formatTimeInZone("2026-11-07T12:00:00Z", "UTC"), "12:00 PM");
});

test("formatDueLabel labels today, tomorrow and later dates", () => {
  assert.equal(formatDueLabel("2026-11-07T10:00:00Z", "UTC", "2026-11-07"), "Today");
  assert.equal(
    formatDueLabel("2026-11-08T10:00:00Z", "UTC", "2026-11-07"),
    "Tomorrow",
  );
  assert.equal(
    formatDueLabel("2026-11-12T10:00:00Z", "UTC", "2026-11-07"),
    "Thu, Nov 12",
  );
});

test("formatRelativeTime describes recent activity", () => {
  const now = new Date("2026-11-07T12:00:00Z");

  assert.equal(formatRelativeTime("2026-11-07T11:59:30Z", now), "Just now");
  assert.equal(formatRelativeTime("2026-11-07T11:55:00Z", now), "5 min ago");
  assert.equal(formatRelativeTime("2026-11-07T11:00:00Z", now), "1 hr ago");
  assert.equal(formatRelativeTime("2026-11-07T09:00:00Z", now), "3 hrs ago");
  assert.equal(formatRelativeTime("2026-11-06T12:00:00Z", now), "1 day ago");
  assert.equal(formatRelativeTime("2026-11-04T12:00:00Z", now), "3 days ago");
  assert.equal(formatRelativeTime("2026-10-28T12:00:00Z", now), "Oct 28");
});

test("formatRelativeTime never reports negative ages as future times", () => {
  const now = new Date("2026-11-07T12:00:00Z");

  assert.equal(formatRelativeTime("2026-11-07T12:05:00Z", now), "Just now");
});
