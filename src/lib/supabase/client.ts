"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Browser Supabase client.
 *
 * Safe for Client Components because it only uses the public URL and
 * publishable key. RLS still applies to every request. Most data fetching
 * happens on the server; this client exists for future interactive features
 * such as realtime updates.
 */
export function createSupabaseBrowserClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    );
  }

  return createBrowserClient(config.url, config.publishableKey);
}
