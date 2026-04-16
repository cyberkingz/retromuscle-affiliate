import { getSaasLandingData } from "@/application/use-cases/get-saas-landing-data";
import { PageShell } from "@/components/layout/page-shell";
import { SaasLandingPage } from "@/features/saas-landing/saas-landing-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "RetroMuscle Programme Créateur",
  description:
    "Tu filmes déjà du contenu fitness. Maintenant sois payé pour ça, au tarif actif de chaque type de vidéo validée.",
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
