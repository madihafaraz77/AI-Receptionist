import { DashboardSidebarContent } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { SupabaseSetupNotice } from "@/components/setup/supabase-setup-notice";
import { requireClinicUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// The dashboard reads the session on every request.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  const user = configured ? await requireClinicUser() : null;

  return (
    <div className="min-h-screen bg-muted/25">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-sidebar-border bg-sidebar lg:block">
        <DashboardSidebarContent user={user} />
      </aside>

      <div className="lg:pl-[17rem]">
        <DashboardTopbar user={user} configured={configured} />
        <main
          id="main-content"
          className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {configured ? children : <SupabaseSetupNotice />}
        </main>
      </div>
    </div>
  );
}
