"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/context/auth-context";
import { CardSection } from "@/components/layout/card-section";
import {
  AFFILIATE_CONTRACT_SECTIONS,
  AFFILIATE_CONTRACT_TITLE,
  AFFILIATE_CONTRACT_VERSION
} from "@/domain/contracts/affiliate-program-contract";
import { useScrollEndGate } from "@/features/contract/hooks/use-scroll-end-gate";

function getContractHighlights() {
  return [
    {
      title: "Droits & ads",
      body: "Les contenus valides peuvent etre utilises en organique et en publicite (ads)."
    },
    {
      title: "Mensuel",
      body: "Un cycle mensuel avec quota, review et paiement apres validation."
    },
    {
      title: "Revisions",
      body: "Si un livrable n'est pas conforme, il peut etre rejete avec une raison claire."
    },
    {
      title: "Non exclusif",
      body: "Tu restes libre de bosser avec d'autres marques (hors confidentialite/compliance)."
    }
  ];
}

export function ContractPage() {
  const auth = useAuth();
  const router = useRouter();
  const highlights = useMemo(() => getContractHighlights(), []);
  const { scrollRef, reachedEnd } = useScrollEndGate();

  const [signerName, setSignerName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptAge, setAcceptAge] = useState(false);
  const [acceptRights, setAcceptRights] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSign =
    Boolean(auth.user) &&
    reachedEnd &&
    signerName.trim().length >= 2 &&
    acceptTerms &&
    acceptAge &&
    acceptRights &&
    !submitting;

  async function signContract() {
    if (!auth.user) {
      router.replace("/login");
      return;
    }

    if (!reachedEnd) {
      setError("Fais defiler le contrat jusqu'en bas avant de signer.");
      return;
    }

    if (signerName.trim().length < 2) {
      setError("Renseigne ton nom complet pour signer.");
      return;
    }

    if (!acceptTerms || !acceptAge || !acceptRights) {
      setError("Valide toutes les cases avant de signer.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contract/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          signerName: signerName.trim(),
          accepted: {
            terms: true,
            age18: true,
            rightsAndReleases: true
          }
        })
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
    <div className="mx-auto max-w-[980px] space-y-6 sm:space-y-7">
      <SectionHeading
        eyebrow="Contrat"
        title="Signature du contrat RetroMuscle"
        subtitle="Lis le contrat, puis signe en dessous pour acceder a ton dashboard."
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <CardSection>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Points essentiels</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div key={item.title} className="overflow-hidden rounded-2xl border border-line bg-frost/70 p-4">
                <p className="font-display text-xl uppercase text-secondary">{item.title}</p>
                <p className="mt-2 break-words text-sm text-foreground/75">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-line bg-frost/60 p-4 text-sm text-foreground/75">
            {reachedEnd ? (
              <p>Contrat defile jusqu&apos;en bas. La signature est disponible.</p>
            ) : (
              <p>Fais defiler le contrat (a droite) jusqu&apos;en bas pour activer la signature.</p>
            )}
          </div>
        </CardSection>

        <CardSection>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Contrat</p>
              <p className="mt-2 font-display text-2xl uppercase text-secondary">{AFFILIATE_CONTRACT_TITLE}</p>
            </div>
            <div className="rounded-full border border-line bg-frost/70 px-3 py-1 text-xs text-foreground/70">
              Version {AFFILIATE_CONTRACT_VERSION}
            </div>
          </div>

          <div
            ref={scrollRef}
            className="mt-4 max-h-[420px] space-y-5 overflow-auto rounded-2xl border border-line bg-white p-4 pr-3 text-sm text-foreground/75 sm:p-5"
          >
            {AFFILIATE_CONTRACT_SECTIONS.map((section) => (
              <div key={section.id} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">{section.title}</p>
                <div className="space-y-3">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
            <p className="pt-2 text-xs text-foreground/55">
              Fin du contrat. La signature est situee juste en dessous.
            </p>
          </div>
        </CardSection>
      </div>

      <CardSection>
        <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Signature</p>
        <p className="mt-2 text-sm text-foreground/75">
          Renseigne ton nom legal et valide les declarations. Le bouton s&apos;active apres lecture (scroll jusqu&apos;en bas).
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="font-medium">Nom complet (signature)</span>
              <Input
                value={signerName}
                onChange={(event) => {
                  setSignerName(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Prenom Nom"
                autoComplete="name"
              />
            </label>

            <div className="space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-frost/70 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-secondary"
                  checked={acceptTerms}
                  onChange={(event) => {
                    setAcceptTerms(event.target.checked);
                    if (error) setError(null);
                  }}
                />
                <span className="text-sm text-foreground/80">
                  J&apos;ai lu et j&apos;accepte le Contrat (version {AFFILIATE_CONTRACT_VERSION}).
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-frost/70 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-secondary"
                  checked={acceptAge}
                  onChange={(event) => {
                    setAcceptAge(event.target.checked);
                    if (error) setError(null);
                  }}
                />
                <span className="text-sm text-foreground/80">Je confirme avoir 18 ans ou plus.</span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-frost/70 p-4">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-secondary"
                  checked={acceptRights}
                  onChange={(event) => {
                    setAcceptRights(event.target.checked);
                    if (error) setError(null);
                  }}
                />
                <span className="text-sm text-foreground/80">
                  Je dispose des droits et autorisations necessaires (musique, images, personnes, lieux) pour les Contenus.
                </span>
              </label>
            </div>

            {error ? (
              <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-line bg-white p-4 text-sm text-foreground/70">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Compte</p>
              <p className="mt-2">{auth.user?.email ?? "Non connecte"}</p>
            </div>

            <Button size="lg" className="h-14 w-full" disabled={!canSign} onClick={signContract}>
              {submitting ? "Signature..." : "Signer et acceder au dashboard"}
            </Button>

            <p className={cn("text-xs text-foreground/60", !auth.user ? "opacity-80" : "")}>
              {auth.user ? "Une fois signe, tu peux acceder au dashboard." : "Connecte-toi pour signer le contrat."}
            </p>
          </div>
        </div>
      </CardSection>
    </div>
  );
}
