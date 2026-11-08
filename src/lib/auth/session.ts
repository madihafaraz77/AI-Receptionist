import "server-only";

import { redirect } from "next/navigation";
import { connection } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/auth/types";

export type { SessionUser } from "@/lib/auth/types";

/**
 * Data Access Layer for the current user.
 *
 * The dashboard never reads the raw Supabase session. It receives this narrow
 * object, which contains only what the UI needs.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  // Fail closed: a Supabase Auth account is not a clinic user until it has an
  // active profile row. This prevents self-registered or deactivated accounts
  // from reaching the dashboard shell, even if they can authenticate.
  if (profileError || !profile || profile.is_active !== true) {
    return null;
  }

  const role = profile.role === "doctor" ? "doctor" : "staff";

  return {
    id: user.id,
    email: user.email ?? "",
    fullName:
      profile.full_name?.trim() || user.email?.split("@")[0] || "Clinic user",
    role,
  };
}

/**
 * Requires a signed-in, active clinic user. Redirects to the login page when
 * the session is missing or no longer valid.
 */
export async function requireClinicUser(): Promise<SessionUser> {
  // Supabase Auth reads the clock while validating the session, so prerendering
  // must stop here and continue at request time.
  await connection();

  const user = await getCurrentUser();

  if (!user) {
    // The proxy handles anonymous visitors before this point. Reaching here
    // means the account authenticated but has no active clinic profile, so
    // explain that instead of bouncing between /login and /dashboard.
    redirect("/login?error=not_authorised");
  }

  return user;
}
