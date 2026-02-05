import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-wide py-12">
      <Card className="mx-auto max-w-xl space-y-4 border-line bg-white/95 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.14em] text-foreground/55">404</p>
        <h1 className="font-display text-4xl uppercase leading-none text-secondary">Page introuvable</h1>
        <p className="text-sm text-foreground/75">
          Cette page n&apos;existe pas ou a ete deplacee.
        </p>
        <Button asChild size="pill">
          <Link href="/">Retour accueil</Link>
        </Button>
      </Card>
    </div>
  );
}
