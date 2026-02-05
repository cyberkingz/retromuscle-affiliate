import { getLandingPageData } from "@/application/use-cases/get-landing-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { LandingPage } from "@/features/landing/landing-page";

export default async function CreatorsPage() {
  const data = await getLandingPageData();

  return (
    <PageShell currentPath="/creators">
      <LandingPage data={data} />
    </PageShell>
  );
}
