import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Server Supabase client for Server Components, Server Actions and Route
 * Handlers. It reads the doctor's session from cookies and still respects RLS.
 *
 * Returns null when Supabase is not configured so callers can render an honest
 * setup state instead of crashing.
 */
export async function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session before rendering, so this can be safely ignored here.
        }
      },
    },
  });
}
