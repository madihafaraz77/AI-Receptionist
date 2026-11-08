/**
 * Supabase environment configuration.
 *
 * Milestone 1 ran without a backend. From Milestone 2 onward the app reads
 * these values from the environment. When they are missing, the dashboard and
 * login page show a clear setup notice instead of pretending to be connected.
 *
 * Supabase now issues publishable keys (`sb_publishable_…`) and secret keys
 * (`sb_secret_…`), and is deprecating the legacy `anon` / `service_role` JWTs by
 * the end of 2026. Both naming schemes are accepted here so a project created
 * today and an older one both work.
 *
 * Only the URL and publishable key are public. The secret key is server-only and
 * must never be imported into a Client Component.
 */

export type SupabaseConfig = {
  url: string;
  publishableKey: string;
  secretKey: string | null;
};

function readEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url =
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    readEnv(process.env.SUPABASE_URL);

  const publishableKey =
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ??
    readEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !publishableKey) {
    return null;
  }

  return {
    url,
    publishableKey,
    secretKey:
      readEnv(process.env.SUPABASE_SECRET_KEY) ??
      readEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
