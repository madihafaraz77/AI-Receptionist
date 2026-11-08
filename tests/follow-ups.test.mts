import test from "node:test";
import assert from "node:assert/strict";

import { parseFollowUpActionForm } from "../src/lib/dashboard/validation.ts";

const followUpId = "0f59a216-4b54-4f6f-86d4-9baa4a4a1018";

function form(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

test("complete accepts a valid follow-up id", () => {
  const result = parseFollowUpActionForm(
    form({ followUpId, status: "completed" }),
  );

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.data.cancellationReason, null);
});

test("cancel requires a reason", () => {
  const result = parseFollowUpActionForm(
    form({ followUpId, status: "cancelled" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.cancellationReason);
});

test("cancel accepts a concise reason", () => {
  const result = parseFollowUpActionForm(
    form({
      followUpId,
      status: "cancelled",
      cancellationReason: "Patient recovered.",
    }),
  );

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.cancellationReason, "Patient recovered.");
  }
});

test("unsupported actions are rejected", () => {
  const result = parseFollowUpActionForm(
    form({ followUpId, status: "sent" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.status);
});

test("follow-up ids must be UUIDs", () => {
  const result = parseFollowUpActionForm(
    form({ followUpId: "not-a-uuid", status: "completed" }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.followUpId);
});

test("cancellation reasons are bounded", () => {
  const result = parseFollowUpActionForm(
    form({
      followUpId,
      status: "cancelled",
      cancellationReason: "x".repeat(501),
    }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.cancellationReason);
});
