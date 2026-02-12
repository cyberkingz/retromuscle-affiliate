"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function UploadsError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-12">
      <Card className="mx-auto max-w-xl space-y-4 border-line bg-white/95 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.14em] text-foreground/55">Erreur uploads</p>
        <h1 className="font-display text-4xl uppercase leading-none text-secondary">
          Impossible de charger les uploads
        </h1>
        <p className="text-sm text-foreground/75">
          Recharge la page ou retourne au dashboard. Si le probleme persiste, reconnecte-toi.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="pill" onClick={reset}>
            Reessayer
          </Button>
          <Button asChild variant="outline" size="pill">
            <Link href="/dashboard">Retour dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
