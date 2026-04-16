import { getLandingPageData } from "@/application/use-cases/get-landing-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { LandingPage } from "@/features/landing/landing-page";
import { createPageMetadata } from "@/app/_lib/metadata";

// Revalidate every 5 minutes — rates change rarely via admin action
export const revalidate = 300;

export const metadata = createPageMetadata({
  title: "Tarifs par type RetroMuscle",
  description:
    "Consulte les tarifs par type de vidéo et estime tes gains selon ton volume de vidéos validées.",
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
