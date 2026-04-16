"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { BRAND_ASSETS } from "@/domain/constants/brand-assets";
import { useAuth } from "@/features/auth/context/auth-context";

export function SiteFooter() {
  const auth = useAuth();
  const isLoggedIn = !auth.loading && Boolean(auth.user);
  const accountTarget = auth.redirectTarget ?? "/onboarding";

  return (
    <footer className="mt-14 border-t border-secondary/70 bg-secondary text-secondary-foreground">
      <div className="container-wide py-12 md:py-16">
        <div className="grid gap-8 text-center md:grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr] md:text-left">
          <div className="flex flex-col items-center space-y-4 md:items-start">
            <Image
              src={BRAND_ASSETS.logo}
              alt="RetroMuscle"
              width={150}
              height={68}
              className="h-14 w-auto object-contain"
            />
            <p className="max-w-sm text-sm text-white/80">
              Le programme créateur RetroMuscle pour aider les créateurs à obtenir un revenu plus
              régulier.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.14em] text-white/90">Plateforme</h2>
            <ul className="space-y-2 text-sm text-white/75">
              {isLoggedIn ? (
                <>
                  <li>
                    <Link href={accountTarget} className="hover:text-white">
                      Mon espace
                    </Link>
                  </li>
                  <li>
                    <Link href="/creators" className="hover:text-white">
                      Programme créateur
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link href="/apply" className="hover:text-white">
                      S&apos;inscrire
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="hover:text-white">
                      Connexion
                    </Link>
                  </li>
                  <li>
                    <Link href="/creators" className="hover:text-white">
                      Programme créateur
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.14em] text-white/90">Ressources</h2>
            <ul className="space-y-2 text-sm text-white/75">
              <li>
                <Link href="/about" className="hover:text-white">
                  Qui est RetroMuscle
                </Link>
              </li>
              <li>
                <Link href="/creators" className="hover:text-white">
                  Tarifs &amp; revenus
                </Link>
              </li>
              <li>
                <Link href="/apply" className="hover:text-white">
                  Postuler
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Confidentialite
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white">
                  Conditions
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm uppercase tracking-[0.14em] text-white/90">
              Newsletter créateurs
            </h2>
            <p className="text-sm text-white/75">
              Recois les prochaines opportunites et les nouvelles du programme créateur.
            </p>
            <div className="space-y-2">
              <input
                type="email"
                placeholder="email@exemple.com"
                aria-label="Email newsletter créateurs"
                className="h-11 w-full rounded-xl border border-white/40 bg-white/10 px-4 text-sm text-white placeholder:text-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <Button className="w-full">S&apos;abonner</Button>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/20 pt-6 text-sm text-white/70">
          <p>&copy; {new Date().getFullYear()} RetroMuscle. Ecommerce + Programme créateur.</p>
        </div>
      </div>
    </footer>
  );
}
