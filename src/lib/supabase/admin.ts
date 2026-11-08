import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Secret-key Supabase client.
 *
 * This bypasses Row Level Security. It must only be used in trusted server code
 * (Server Actions, Route Handlers, scripts) and never sent to the browser.
 *
 * Use it for privileged workflows such as public booking, notification workers
 * and scheduled jobs. Always re-check authorization in the caller.
 */
export function createSupabaseAdminClient() {
  const config = getSupabaseConfig();

  if (!config?.secretKey) {
    throw new Error(
      "Supabase secret key is not configured. Add SUPABASE_SECRET_KEY (or the legacy SUPABASE_SERVICE_ROLE_KEY) to the server environment.",
    );
  }

  return createClient(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
