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
        <div className="container-wide flex h-8 items-center justify-center text-[11px] uppercase tracking-[0.16em]">
          PROGRAMME AFFILIE OUVERT • REPONSE SOUS 48H • PAIEMENTS MENSUELS
        </div>
      </div>

      <div className="border-b border-line bg-background/95 backdrop-blur">
        <div className="container-wide grid h-20 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <nav className="hidden items-center gap-5 md:flex">
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

          <Link
            href="/"
            className="justify-self-center rounded-xl border border-transparent px-2 py-1 transition-transform hover:-translate-y-0.5 hover:border-line"
          >
            <Image
              src={BRAND_ASSETS.logo}
              alt="RetroMuscle"
              width={124}
              height={56}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center justify-end gap-2">
            <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
              <Link href="/creators">Gains</Link>
            </Button>
            {!auth.loading && auth.session ? (
              <>
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                  <Link href={appTarget}>{appLabel}</Link>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    void auth.signOut();
                  }}
                >
                  Deconnexion
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild size="sm">
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
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <div id="mobile-site-nav" className="container-wide border-t border-line py-3 md:hidden">
            <nav className="space-y-2">
              {links.map((link) => {
                const isCurrent =
                  currentPath === link.href || (link.href === "/apply" && currentPath === "/onboarding");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm uppercase tracking-[0.08em]",
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
                    className="block rounded-lg px-3 py-2 text-sm uppercase tracking-[0.08em] text-foreground/75 hover:bg-frost/60"
                  >
                    {appLabel}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void auth.signOut();
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm uppercase tracking-[0.08em] text-foreground/75 hover:bg-frost/60"
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
                      "block rounded-lg px-3 py-2 text-sm uppercase tracking-[0.08em]",
                      currentPath === "/login" ? "bg-frost text-foreground" : "text-foreground/75 hover:bg-frost/60"
                    )}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/apply"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm uppercase tracking-[0.08em]",
                      currentPath === "/apply" ? "bg-frost text-foreground" : "text-foreground/75 hover:bg-frost/60"
                    )}
                  >
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
