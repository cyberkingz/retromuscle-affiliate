import { getSaasLandingData } from "@/application/use-cases/get-saas-landing-data";
import { PageShell } from "@/components/layout/page-shell";
import { SaasLandingPage } from "@/features/saas-landing/saas-landing-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "RetroMuscle Programme Affilie",
  description: "Transforme ton contenu en revenu mensuel regulier avec des missions claires et un paiement mensuel.",
  path: ""
});

export default async function HomePage() {
  const data = await getSaasLandingData();

  return (
    <PageShell currentPath="/">
      <SaasLandingPage data={data} />
    </PageShell>
  );
}
