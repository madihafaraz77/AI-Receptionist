import test from "node:test";
import assert from "node:assert/strict";

import { parseKnowledgeEntryForm } from "../src/lib/ai/knowledge-validation.ts";

function form(fields: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

test("a complete knowledge entry is accepted", () => {
  const result = parseKnowledgeEntryForm(
    form({
      title: "Cancellation policy",
      category: "policies",
      content: "Patients should contact the clinic directly to reschedule.",
      isActive: "on",
    }),
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.data.title, "Cancellation policy");
  assert.equal(result.data.category, "policies");
  assert.equal(result.data.isActive, true);
});

test("an entry rejects unknown categories", () => {
  const result = parseKnowledgeEntryForm(
    form({
      title: "Something",
      category: "clinical",
      content: "This is a sufficiently long but unapproved category.",
    }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.category);
});

test("an entry rejects very long content", () => {
  const result = parseKnowledgeEntryForm(
    form({
      title: "Something",
      category: "faq",
      content: "x".repeat(2001),
    }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) assert.ok(result.errors.content);
});

test("an entry requires a meaningful approved fact", () => {
  const result = parseKnowledgeEntryForm(
    form({
      title: "",
      category: "faq",
      content: "short",
    }),
  );

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.title);
    assert.ok(result.errors.content);
  }
});
