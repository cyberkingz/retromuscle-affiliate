import { PageShell } from "@/components/layout/page-shell";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Conditions du programme RetroMuscle",
  description: "Conditions generales d'utilisation du programme affilie RetroMuscle.",
  path: "/terms"
});

export default function TermsPage() {
  return (
    <PageShell>
      <div className="mx-auto w-full max-w-3xl">
        <CardSection padding="lg">
          <SectionHeading
            eyebrow="Legal"
            title="Conditions du programme"
            subtitle="Cadre general. Le contrat complet reste la reference juridique."
          />

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-foreground/80">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">
              Derniere mise a jour: 6 fevrier 2026
            </p>

            <div className="space-y-2">
              <p className="font-semibold">1. Objet</p>
              <p>
                Ces conditions decrivent le fonctionnement general de la plateforme et du programme affilie RetroMuscle
                (missions, livrables, validation, remuneration).
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">2. Eligibilite</p>
              <p>
                L&apos;acces au programme est soumis a validation. RetroMuscle peut refuser ou mettre en pause un compte
                en cas de non-respect des criteres de qualite, delais ou comportements abusifs.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">3. Contenus</p>
              <p>
                Les contenus envoyes doivent respecter les briefs, specs (format, duree, rendu) et les droits d&apos;image
                et de musique. Le contrat signe detaille les droits concédés a RetroMuscle.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">4. Paiements</p>
              <p>
                Les paiements sont declenches apres validation. Les delais bancaires et frais eventuels restent
                independants de RetroMuscle.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">5. Support</p>
              <p>
                Pour toute question: support@retromuscle.net
              </p>
            </div>
          </div>
        </CardSection>
      </div>
    </PageShell>
  );
}
