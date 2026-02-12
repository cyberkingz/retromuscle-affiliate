"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="bg-background text-foreground">
        <main className="container-wide flex min-h-screen items-center justify-center py-10">
          <div className="w-full max-w-xl space-y-4 rounded-[22px] border border-line bg-white/95 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.14em] text-foreground/55">Erreur critique</p>
            <h1 className="font-display text-4xl uppercase leading-none text-secondary">
              Une erreur inattendue est survenue
            </h1>
            <p className="text-sm text-foreground/75">
              Recharge la page ou retourne a l&apos;accueil. Si le probleme persiste, reconnecte-toi.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="pill" onClick={reset}>
                Reessayer
              </Button>
              <Button asChild variant="outline" size="pill">
                <Link href="/">Retour accueil</Link>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
