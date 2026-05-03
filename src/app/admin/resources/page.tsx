import { getAllResources } from "@/application/use-cases/get-all-resources";
import { protectPage } from "@/features/auth/server/route-guards";
import { AdminResourcesPage } from "@/features/admin-resources/admin-resources-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Ressources — Admin RetroMuscle",
  description: "Gérer les guides et ressources disponibles pour les créateurs.",
  path: "/admin/resources",
  noIndex: true
});

export default async function AdminResourcesRoute() {
  await protectPage("/admin");

  const resources = await getAllResources();

  return <AdminResourcesPage resources={resources} />;
}
