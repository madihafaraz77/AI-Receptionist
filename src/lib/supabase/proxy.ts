import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Refreshes the Supabase session and protects dashboard routes.
 *
 * Next.js 16 renamed `middleware` to `proxy`. The proxy is a first line of
 * defence only: every Server Action and data access function also verifies the
 * session, because proxy matchers can change over time.
 */
export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();

  // Without Supabase the app shows a setup notice. There is no patient data to
  // protect, so let the request through.
  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // getUser() validates the token with Supabase Auth. Do not trust
  // getSession() alone in server code.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname);

    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (user && pathname === "/login") {
    // Only send a signed-in account to the dashboard when it has an active
    // clinic profile. Redirecting deactivated or unprovisioned accounts would
    // create a /login ↔ /dashboard loop, because the dashboard fails closed.
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_active === true) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}
