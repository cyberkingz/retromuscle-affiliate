"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { useAuth } from "@/features/auth/context/auth-context";

interface SiteHeaderProps {
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

const marketingLinks: Array<{ href: Route; label: string }> = [
  { href: "/", label: "Pourquoi rejoindre" },
  { href: "/creators", label: "Revenus" }
];

const adminLinks: Array<{ href: Route; label: string }> = [
  { href: "/admin", label: "Operations" },
  { href: "/admin/applications" as Route, label: "Candidatures" }
];

export function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth();
  const appTarget = auth.redirectTarget ?? "/onboarding";
  const appLabel = auth.role === "admin" ? "Admin" : "Mon espace";
  const links = auth.role === "admin" && auth.session ? adminLinks : marketingLinks;

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-secondary/60 bg-secondary text-secondary-foreground">
        <div className="container-wide flex h-8 items-center justify-center text-[10px] uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]">
          <span className="hidden xs:inline">PROGRAMME AFFILIE OUVERT • </span>
          REPONSE SOUS 48H • PAIEMENTS MENSUELS
        </div>
      </div>

      <div className="border-b border-line bg-background/95 backdrop-blur">
        <div className="container-wide flex h-16 items-center justify-between md:h-20 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
          <div className="hidden md:flex items-center gap-5">
            <nav className="flex items-center gap-5">
              {links.map((link) => {
                const isCurrent =
                  currentPath === link.href || (link.href === "/apply" && currentPath === "/onboarding");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm uppercase tracking-[0.08em] transition-colors",
                      isCurrent ? "text-foreground" : "text-foreground/70 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-1 md:flex-none md:justify-center">
            <Link
              href="/"
              className="rounded-xl border border-transparent px-2 py-1 transition-transform hover:-translate-y-0.5 hover:border-line"
            >
              <Image
                src={BRAND_ASSETS.logo}
                alt="RetroMuscle"
                width={124}
                height={56}
                className="h-10 w-auto object-contain md:h-14"
                priority
              />
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-2 md:flex-none">
            {!auth.loading && auth.session ? (
              <>
                <Button asChild size="sm" variant="outline" className="hidden xs:inline-flex">
                  <Link href={appTarget}>{appLabel}</Link>
                </Button>
                <Button
                  size="sm"
                  className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
                  onClick={() => {
                    void auth.signOut();
                  }}
                >
                  Deconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="outline" className="hidden xs:inline-flex">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm" className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">
                  <Link href="/apply">S&apos;inscrire</Link>
                </Button>
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-nav"
              onClick={() => setMobileOpen((value) => !value)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </Button>
          </div>
        </div>

        <div
          id="mobile-site-nav"
          className={cn(
            "grid transition-all duration-300 ease-in-out md:hidden",
            mobileOpen ? "grid-rows-[1fr] border-t border-line opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <nav className="container-wide space-y-1 py-4">
              {links.map((link) => {
                const isCurrent =
                  currentPath === link.href || (link.href === "/apply" && currentPath === "/onboarding");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-sm uppercase tracking-[0.08em]",
                      isCurrent ? "bg-frost text-foreground" : "text-foreground/75 hover:bg-frost/60"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {!auth.loading && auth.session ? (
                <>
                  <Link
                    href={appTarget}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-3 text-sm uppercase tracking-[0.08em] text-foreground/75 hover:bg-frost/60"
                  >
                    {appLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void auth.signOut();
                    }}
                    className="block w-full rounded-lg px-3 py-3 text-left text-sm uppercase tracking-[0.08em] text-foreground/75 hover:bg-frost/60"
                  >
                    Deconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-sm uppercase tracking-[0.08em]",
                      currentPath === "/login" ? "bg-frost text-foreground" : "text-foreground/75 hover:bg-frost/60"
                    )}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/apply"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-sm uppercase tracking-[0.08em]",
                      currentPath === "/apply" ? "bg-frost text-foreground" : "text-foreground/75 hover:bg-frost/60"
                    )}
                  >
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
