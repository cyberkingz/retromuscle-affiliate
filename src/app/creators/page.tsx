import { getLandingPageData } from "@/application/use-cases/get-landing-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { LandingPage } from "@/features/landing/landing-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Revenus & Packs RetroMuscle",
  description: "Decouvre les packs, les rates par type et les mixes de contenu pour estimer tes revenus.",
  path: "/creators"
});

export default async function CreatorsPage() {
  const data = await getLandingPageData();

  return (
    <PageShell currentPath="/creators">
      <LandingPage data={data} />
    </PageShell>
  );
}
