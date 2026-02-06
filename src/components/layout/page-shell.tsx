import type { PropsWithChildren } from "react";

import { cn } from "@/lib/cn";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

interface PageShellProps extends PropsWithChildren {
  currentPath?:
    | "/"
    | "/apply"
    | "/login"
    | "/onboarding"
    | "/contract"
    | "/creators"
    | "/join"
    | "/dashboard"
    | "/admin"
    | "/admin/applications";
}

export function PageShell({ children, currentPath }: PageShellProps) {
  const isAuthPage = currentPath === "/apply" || currentPath === "/login";
  const isHomePage = currentPath === "/";

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-24 h-64 w-64 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute left-0 top-[38%] h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
          <div className="absolute bottom-[-110px] right-[20%] h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        </div>
      </div>

      <SiteHeader currentPath={currentPath} />

      <main
        className={cn(
          "container-wide flex-1 overflow-x-hidden",
          isAuthPage
            ? "pb-6 pt-6 sm:pb-8 sm:pt-8 md:pb-10 md:pt-10"
            : isHomePage
              ? "pb-8 pt-2 sm:pb-12 sm:pt-4 md:pt-6"
              : "pb-8 pt-6 sm:pb-12 sm:pt-10 md:pt-12"
        )}
      >
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
