import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApplicationRecord } from "@/features/apply/types";

interface PendingReviewPanelProps {
  application: ApplicationRecord;
}

export function PendingReviewPanel({ application }: PendingReviewPanelProps) {
  return (
    <Card className="border-line bg-frost/70 p-5 sm:p-6">
      <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Dossier recu</p>
      <p className="mt-2 font-display text-2xl uppercase leading-none text-secondary">
        Ton dossier est en cours de revue
      </p>
      <p className="mt-3 text-sm text-foreground/75">
        Notre equipe revient vers toi sous 48h. En attendant, tu peux fermer cette page.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Pack</p>
          <p className="mt-1 text-sm font-semibold text-foreground">Pack {application.package_tier}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Mix</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{application.mix_name}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild size="pill" variant="outline">
          <Link href="/">Retour accueil</Link>
        </Button>
      </div>
    </Card>
  );
}

