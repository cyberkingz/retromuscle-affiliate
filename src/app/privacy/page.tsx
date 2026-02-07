import { PageShell } from "@/components/layout/page-shell";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Confidentialite RetroMuscle",
  description: "Comment RetroMuscle collecte et utilise tes donnees sur la plateforme.",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl">
        <CardSection padding="lg">
          <SectionHeading
            eyebrow="Legal"
            title="Politique de confidentialite"
            subtitle="Resume clair de comment RetroMuscle collecte et utilise tes donnees."
          />

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/80">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
              Derniere mise a jour: 6 fevrier 2026
            </p>

            <div className="space-y-2">
              <p className="font-semibold">1. Donnees collectees</p>
              <p>
                Nous collectons les informations necessaires au fonctionnement du programme (compte, profil, contact,
                liens sociaux, informations de paiement), ainsi que les contenus que tu uploades (videos, rushes).
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">2. Utilisation</p>
              <p>
                Ces donnees servent a gerer ton onboarding, suivre tes livrables, valider les contenus, calculer les
                remunerations et declencher les paiements.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">3. Partage</p>
              <p>
                Les donnees sont accessibles a l&apos;equipe RetroMuscle pour l&apos;operationnel (validation, support,
                comptabilite). Nous ne revendons pas tes donnees personnelles.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">4. Conservation</p>
              <p>
                Les donnees sont conservees pendant la duree du programme, puis archivees selon nos obligations legales
                (ex: comptabilite).
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">5. Tes droits</p>
              <p>
                Tu peux demander l&apos;acces, la rectification ou la suppression de tes donnees (dans les limites
                legales). Contact: support@retromuscle.net
              </p>
            </div>
          </div>
        </CardSection>
      </div>
    </PageShell>
  );
}
