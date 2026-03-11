import { getSaasLandingData } from "@/application/use-cases/get-saas-landing-data";
import { PageShell } from "@/components/layout/page-shell";
import { SaasLandingPage } from "@/features/saas-landing/saas-landing-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "RetroMuscle Programme Créateur",
  description: "Filme du contenu fitness, reçois un paiement chaque mois. Brief clair, validation rapide, revenu régulier.",
  path: ""
});

export const revalidate = 300;

export default async function HomePage() {
  const data = await getSaasLandingData();

  return (
    <PageShell currentPath="/">
      <SaasLandingPage data={data} />
    </PageShell>
  );
}
