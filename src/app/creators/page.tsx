import { getLandingPageData } from "@/application/use-cases/get-landing-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { LandingPage } from "@/features/landing/landing-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Tarifs par type RetroMuscle",
  description: "Consulte les tarifs par type de video et estime tes gains selon ton volume de videos validees.",
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
