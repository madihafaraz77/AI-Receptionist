import "server-only";

import { headers } from "next/headers";

/**
 * Best-effort per-instance rate limiting for public, unauthenticated actions.
 * It is not a substitute for a global edge limit, but it prevents obvious
 * accidental or abusive bursts from consuming AI calls, bookings or feedback.
 */

const windows = new Map<string, number[]>();

function readClientAddress(headersList: Headers): string {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip")?.trim() ||
    "unknown-client"
  );
}

export async function rateLimitPublicAction(
  action: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean }> {
  const headersList = await headers();
  const key = `${action}:${readClientAddress(headersList)}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  const existing = (windows.get(key) ?? []).filter(
    (timestamp) => timestamp > windowStart,
  );

  if (existing.length >= limit) {
    windows.set(key, existing);
    return { ok: false };
  }

  existing.push(now);
  windows.set(key, existing);

  // Keep memory bounded for long-running processes.
  if (windows.size > 10_000) {
    for (const [entryKey, timestamps] of windows) {
      const fresh = timestamps.filter((timestamp) => timestamp > windowStart);

      if (fresh.length === 0) {
        windows.delete(entryKey);
      } else {
        windows.set(entryKey, fresh);
      }
    }
  }

  return { ok: true };
}
