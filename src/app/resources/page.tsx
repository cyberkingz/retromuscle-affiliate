import { getPublishedResources } from "@/application/use-cases/get-published-resources";
import { PageShell } from "@/components/layout/page-shell";
import { protectPage } from "@/features/auth/server/route-guards";
import { CreatorResourcesPage } from "@/features/creator-resources/creator-resources-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Ressources - RetroMuscle",
  description: "Guides et conseils pour créer du contenu de qualité pour RetroMuscle.",
  path: "/resources",
  noIndex: true
});

export default async function ResourcesRoute() {
  await protectPage("/dashboard");

  const resources = await getPublishedResources();

  return (
    <PageShell currentPath="/resources">
      <CreatorResourcesPage resources={resources} />
    </PageShell>
  );
}
