/**
 * Framework-free safety checks for the public AI receptionist.
 *
 * These checks run before any model call. They are deliberately conservative:
 * the assistant is administrative help, not clinical care.
 */

export type AiSafetyCategory = "emergency" | "medical_advice" | null;

const EMERGENCY_PATTERN =
  /(chest pain|severe bleeding|can't breathe|cannot breathe|difficulty breathing|shortness of breath|passed out|collapsed|seizure|unconscious|suicid|overdose|overdosed)/i;

const MEDICAL_ADVICE_PATTERN =
  /(diagnos|symptom|pain|fever|medicine|medication|dose|dosage|prescription|prescrib|remedy|treatment|report|test result|blood test|x-ray|pregnan|injury|infection|curing?|cure)/i;

const HANDOVER_PATTERN =
  /(\bhuman\b|real person|member of (?:the )?clinic (?:team|staff)|clinic team|clinic staff|receptionist|talk to someone|someone from the clinic)/i;

export function isHumanHandoverRequest(message: string): boolean {
  return HANDOVER_PATTERN.test(message);
}

export function classifyAiSafety(message: string): AiSafetyCategory {
  if (EMERGENCY_PATTERN.test(message)) {
    return "emergency";
  }

  if (MEDICAL_ADVICE_PATTERN.test(message)) {
    return "medical_advice";
  }

  return null;
}

export function safeRefusal(category: Exclude<AiSafetyCategory, null>): string {
  if (category === "emergency") {
    return "I’m not a doctor and this may be urgent. Call your local emergency service or go to the nearest hospital right now. The clinic cannot provide emergency medical help through this chat.";
  }

  return "I can help with clinic information such as hours, services, fees and booking policies, but I can’t diagnose, prescribe, interpret reports or recommend medicines. Please ask the doctor directly for medical advice.";
}
