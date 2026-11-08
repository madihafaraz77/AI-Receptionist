"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  email?: string;
};

/**
 * Signs the doctor in with Supabase Auth.
 *
 * Validation and error messages are intentionally generic: never reveal whether
 * an email address exists.
 */
export async function signInAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedNext = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Enter your email address and password.", email };
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      error:
        "Supabase is not configured yet. Add the project keys to .env.local and restart the app.",
      email,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return {
      error: "Those details did not match an active clinic account.",
      email,
    };
  }

  // Authentication alone is not clinic access. The account must have an active
  // profile row created by the clinic owner. Otherwise clear the session and
  // show the generic "not authorised" state.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || profile?.is_active !== true) {
    await supabase.auth.signOut();
    redirect("/login?error=not_authorised");
  }

  // Only allow internal dashboard destinations after sign-in.
  const next = requestedNext.startsWith("/dashboard")
    ? requestedNext
    : "/dashboard";

  redirect(next);
}
