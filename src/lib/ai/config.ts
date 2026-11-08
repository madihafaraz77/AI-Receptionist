import "server-only";

/**
 * OpenAI configuration for the public AI receptionist.
 *
 * The key is server-side only and is never sent to the browser. A missing or
 * empty key disables the assistant honestly; it does not switch to a fake
 * response.
 */

export type OpenAiConfig = {
  apiKey: string;
  model: string;
};

function readEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getOpenAiConfig(): OpenAiConfig | null {
  const apiKey = readEnv(process.env.OPENAI_API_KEY);
  const model = readEnv(process.env.OPENAI_MODEL);

  if (!apiKey || !model) {
    return null;
  }

  return { apiKey, model };
}

export function isAiReceptionistConfigured(): boolean {
  return getOpenAiConfig() !== null;
}
