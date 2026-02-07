"use client";

import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";

import { Button } from "@/components/ui/button";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/context/auth-context";
import { usePathname } from "next/navigation";

const adminLinks: Array<{ href: Route; label: string }> = [
  { href: "/admin", label: "Operations" },
  { href: "/admin/applications" as Route, label: "Candidatures" }
];

export function AdminHeader() {
  const auth = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-background/95 backdrop-blur">
      <div className="container-wide flex h-16 items-center justify-between md:h-20 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4">
        <nav className="hidden md:flex items-center gap-5">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm uppercase tracking-[0.08em] transition-colors",
                pathname === link.href ? "text-foreground" : "text-foreground/70 hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 md:flex-none md:justify-center">
          <Link
            href="/admin"
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
          <div className="hidden sm:block text-xs text-foreground/60">
            {auth.user?.email ?? "Admin"}
          </div>
          <Button
            size="sm"
            className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            onClick={() => {
              void auth.signOut();
            }}
          >
            Deconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}

