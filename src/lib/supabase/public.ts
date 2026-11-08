import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Cookie-less Supabase client for public, read-only content.
 *
 * It uses only the publishable key, so Row Level Security still applies and
 * anonymous visitors can read exactly what the public policies allow: clinic
 * settings, opening hours, closures and active services.
 *
 * Public pages use this inside a cached data function. It never reads cookies,
 * so it cannot leak a doctor's session into a shared page.
 */
export function createSupabasePublicClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
