"use client";

import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { useAuth } from "@/features/auth/context/auth-context";

export interface SiteHeaderNotification {
  message: string;
  href?: Route;
  tone?: "amber" | "info";
}

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
    | "/uploads"
    | "/payouts"
    | "/settings"
    | "/admin"
    | "/admin/applications"
    | "/admin/config"
    | "/about"
    | "/onboarding/approved";
  notification?: SiteHeaderNotification | null;
}

const marketingLinks: Array<{ href: Route; label: string }> = [
  { href: "/about" as Route, label: "\u00c0 propos" }
];

const creatorLinks: Array<{ href: Route; label: string }> = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/uploads", label: "Uploads" },
  { href: "/payouts", label: "Paiements" },
  { href: "/settings", label: "Param\u00e8tres" }
];

const adminLinks: Array<{ href: Route; label: string }> = [
  { href: "/admin", label: "Operations" },
  { href: "/admin/applications" as Route, label: "Candidatures" },
  { href: "/admin/config" as Route, label: "Tarifs" }
];

export function SiteHeader({ currentPath, notification }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Sync inert attribute — prevents focus reaching hidden links
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (mobileOpen) {
      drawer.removeAttribute("inert");
    } else {
      drawer.setAttribute("inert", "");
    }
  }, [mobileOpen]);

  // Close on Escape and return focus to toggle button
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);
  const isAdmin = auth.role === "admin" && Boolean(auth.user);
  const isAffiliate = auth.role === "affiliate" && Boolean(auth.user);
  const affiliateReady = isAffiliate && auth.redirectTarget === "/dashboard";
  const isOnboarding = isAffiliate && !affiliateReady;

  const appTarget = auth.redirectTarget ?? "/onboarding";
  const accountTarget = isAdmin ? "/admin" : affiliateReady ? "/dashboard" : appTarget;
  const accountLabel = isAdmin ? "Admin" : "Mon espace";
  const links = isAdmin
    ? adminLinks
    : affiliateReady
      ? creatorLinks
      : isOnboarding
        ? []
        : marketingLinks;

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement / notification bar — hidden for admin, contextual for creators, marketing for public */}
      {!isAdmin ? (
        affiliateReady && notification ? (
          <div className={cn(
            "border-b",
            notification.tone === "amber"
              ? "border-amber-400/40 bg-amber-400 text-amber-950"
              : "border-secondary/60 bg-secondary text-secondary-foreground"
          )}>
            <div className="container-wide flex h-8 items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]">
              {notification.href ? (
                <Link href={notification.href} className="hover:underline">
                  {notification.message}
                </Link>
              ) : (
                <span>{notification.message}</span>
              )}
            </div>
          </div>
        ) : affiliateReady ? null : (
          <div className="border-b border-secondary/60 bg-secondary text-secondary-foreground">
            <div className="container-wide flex h-8 items-center justify-center text-[10px] uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.16em]">
              <span className="hidden xs:inline">PROGRAMME CRÉATEUR OUVERT • </span>
              RÉPONSE SOUS 48H • PAIEMENTS MENSUELS
            </div>
          </div>
        )
      ) : null}

      <div className="border-b border-line bg-background/95 backdrop-blur">
        {/* 3-col grid on all sizes: [left | center | right] */}
        <div className="container-wide grid h-16 grid-cols-[auto_1fr_auto] items-center gap-2 md:h-20 md:grid-cols-[1fr_auto_1fr] md:gap-4">

          {/* ── Col 1 left: hamburger (mobile) / nav links (desktop) ── */}
          <div className="flex items-center">
            <Button
              ref={toggleRef}
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-site-nav"
              onClick={() => setMobileOpen((value) => !value)}
            >
              <span className="sr-only">{mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
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
            <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-5">
              {links.map((link) => {
                const isCurrent =
                  currentPath === link.href ||
                  (link.href === "/apply" && currentPath === "/onboarding");
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

          {/* ── Col 2 center: logo ── */}
          <div className="flex justify-center">
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

          {/* ── Col 3 right: action buttons ── */}
          <div className="flex items-center justify-end gap-2">
            {!auth.loading && auth.user ? (
              <>
                {!isOnboarding ? (
                  <Button asChild size="sm" variant="outline" className="hidden xs:inline-flex">
                    <Link href={accountTarget}>{accountLabel}</Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  className={cn(
                    "h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm",
                    isOnboarding && "hidden md:inline-flex"
                  )}
                  onClick={() => {
                    void auth.signOut();
                  }}
                >
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                {/* Connexion: desktop only — on mobile it lives in the drawer */}
                <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
                  <Link href="/login">Connexion</Link>
                </Button>
                {/* S'inscrire: always visible */}
                <Button asChild size="sm" className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm">
                  <Link href="/apply">S&apos;inscrire</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div
          ref={drawerRef}
          id="mobile-site-nav"
          aria-hidden={!mobileOpen}
          className={cn(
            "grid transition-all duration-300 ease-in-out md:hidden",
            mobileOpen
              ? "grid-rows-[1fr] border-t border-line opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <nav aria-label="Menu mobile" className="container-wide space-y-1 py-4">
              {links.map((link) => {
                const isCurrent =
                  currentPath === link.href ||
                  (link.href === "/apply" && currentPath === "/onboarding");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-3 py-3 text-sm uppercase tracking-[0.08em]",
                      isCurrent
                        ? "font-semibold text-foreground"
                        : "text-foreground/75 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {!auth.loading && auth.user ? (
                <>
                  {!isOnboarding ? (
                    <Link
                      href={accountTarget}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-3 text-sm uppercase tracking-[0.08em] text-foreground/75 hover:text-foreground"
                    >
                      {accountLabel}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      void auth.signOut();
                    }}
                    className="block w-full px-3 py-3 text-left text-sm uppercase tracking-[0.08em] text-foreground/75 hover:text-foreground"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-3 py-3 text-sm uppercase tracking-[0.08em]",
                      currentPath === "/login"
                        ? "font-semibold text-foreground"
                        : "text-foreground/75 hover:text-foreground"
                    )}
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/apply"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "block px-3 py-3 text-sm uppercase tracking-[0.08em]",
                      currentPath === "/apply"
                        ? "font-semibold text-foreground"
                        : "text-foreground/75 hover:text-foreground"
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
