import type { PropsWithChildren } from "react";

import { AdminHeader } from "@/components/layout/admin-header";
import { SupabaseConfigWarning } from "@/components/system/supabase-config-warning";

export function AdminShell({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Aller au contenu principal
      </a>
      <AdminHeader />
      <main
        id="main-content"
        className="container-wide flex-1 overflow-x-hidden pb-8 pt-6 sm:pb-12 sm:pt-10 md:pt-12"
      >
        <div className="space-y-6">
          <SupabaseConfigWarning />
          {children}
        </div>
      </main>
    </div>
  );
}
