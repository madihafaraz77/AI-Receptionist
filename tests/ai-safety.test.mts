import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyAiSafety,
  isHumanHandoverRequest,
  safeRefusal,
} from "../src/lib/ai/safety.ts";

test("explicit human requests are handover triggers", () => {
  assert.equal(isHumanHandoverRequest("I want to talk to a human"), true);
  assert.equal(isHumanHandoverRequest("Can I speak to a member of the clinic team?"), true);
  assert.equal(isHumanHandoverRequest("What are your hours?"), false);
});

test("emergency language is classified before the model call", () => {
  assert.equal(classifyAiSafety("I have severe chest pain"), "emergency");
  assert.equal(classifyAiSafety("My child cannot breathe"), "emergency");
  assert.equal(classifyAiSafety("I overdosed tonight"), "emergency");
});

test("medical advice requests are blocked", () => {
  assert.equal(classifyAiSafety("What medicine should I take?"), "medical_advice");
  assert.equal(classifyAiSafety("Please diagnose my rash"), "medical_advice");
  assert.equal(classifyAiSafety("Read my blood test results"), "medical_advice");
});

test("ordinary clinic questions can reach the model", () => {
  assert.equal(classifyAiSafety("What are your clinic hours?"), null);
  assert.equal(classifyAiSafety("How much is an online consultation?"), null);
  assert.equal(classifyAiSafety("Do you accept walk-ins on Saturday?"), null);
});

test("safe refusals do not provide medical advice", () => {
  assert.match(safeRefusal("emergency"), /emergency service|hospital/i);
  assert.match(safeRefusal("medical_advice"), /can’t diagnose/i);
});
