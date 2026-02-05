"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/context/auth-context";

function getContractHighlights() {
  return [
    {
      title: "Cession des droits",
      body: "Les contenus valides peuvent etre utilises par RetroMuscle sur ses canaux (ads, site, reseaux)."
    },
    {
      title: "Rythme & deadlines",
      body: "Tu suis un cycle mensuel avec un quota clair et une deadline definie."
    },
    {
      title: "Paiement mensuel",
      body: "Les paiements sont prepares mensuellement apres validation des contenus du cycle."
    },
    {
      title: "Qualite & revisions",
      body: "Si un livrable ne respecte pas les specs, il peut etre rejete avec une raison claire."
    }
  ];
}

export function ContractPage() {
  const auth = useAuth();
  const router = useRouter();
  const highlights = useMemo(() => getContractHighlights(), []);

  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = auth.session?.access_token ?? null;
  const canSign = Boolean(accessToken) && accepted && !submitting;

  async function signContract() {
    if (!accessToken) {
      router.replace("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contract/sign", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        cache: "no-store"
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(data?.message ?? "Impossible de signer le contrat pour le moment.");
      }

      await auth.refreshRouting();
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de signer le contrat.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[980px] space-y-6 pt-8 sm:space-y-7 sm:pt-10">
      <SectionHeading
        eyebrow="Contrat"
        title="Signature du contrat RetroMuscle"
        subtitle="Derniere etape avant d'acceder a ton dashboard. Lecture rapide, puis signature en un clic."
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-line bg-white/95 p-5 sm:p-7">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Points essentiels</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-line bg-frost/70 p-4">
                <p className="font-display text-xl uppercase text-secondary">{item.title}</p>
                <p className="mt-2 text-sm text-foreground/75">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-white px-4 py-4 sm:px-5">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Texte legal (MVP)</p>
            <div className="mt-3 max-h-[240px] space-y-3 overflow-auto pr-2 text-sm text-foreground/75">
              <p>
                En rejoignant le programme affilie RetroMuscle, tu acceptes de produire des contenus conformes aux
                briefs, dans les formats acceptes, et de respecter les deadlines du cycle mensuel.
              </p>
              <p>
                Les contenus valides peuvent etre utilises par RetroMuscle pour ses communications marketing (organique
                et publicitaire). Les paiements sont declenches apres validation des livrables du mois.
              </p>
              <p>
                Si un livrable ne respecte pas les specs, il peut etre rejete avec une raison. Tu peux re-uploader une
                version conforme.
              </p>
              <p>
                Ce texte est une version MVP. Une version complete pourra etre ajoutee (DocuSign/PandaDoc) sans changer
                ton experience.
              </p>
            </div>
          </div>
        </Card>

        <Card className="border-line bg-white/95 p-5 sm:p-7">
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Signature</p>

          <div className="mt-4 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-frost/70 p-4">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-secondary"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span className="text-sm text-foreground/80">
                J'ai lu et j'accepte les conditions du programme (cession des droits, paiement mensuel, deadlines).
              </span>
            </label>

            {error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button size="lg" className="h-14 w-full" disabled={!canSign} onClick={signContract}>
              {submitting ? "Signature..." : "Signer et acceder au dashboard"}
            </Button>

            <p className={cn("text-xs text-foreground/60", !accessToken ? "opacity-80" : "")}>
              {accessToken
                ? "Tu peux signer maintenant, puis commencer a livrer tes missions."
                : "Connecte-toi pour signer le contrat."}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

