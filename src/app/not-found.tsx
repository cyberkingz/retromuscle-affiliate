import Link from "next/link";

import { CardSection } from "@/components/layout/card-section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-wide py-12">
      <CardSection className="mx-auto max-w-xl space-y-4" padding="lg">
        <p className="text-xs uppercase tracking-[0.14em] text-foreground/55">404</p>
        <h1 className="font-display text-4xl uppercase leading-none text-secondary">Page introuvable</h1>
        <p className="text-sm text-foreground/75">
          Cette page n&apos;existe pas ou a ete deplacee.
        </p>
        <Button asChild size="pill">
          <Link href="/">Retour accueil</Link>
        </Button>
      </CardSection>
    </div>
  );
}
