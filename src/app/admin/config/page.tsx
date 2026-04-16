import { getAdminConfigData } from "@/application/use-cases/get-admin-config-data";
import { protectPage } from "@/features/auth/server/route-guards";
import { AdminConfigPage } from "@/features/admin-config/admin-config-page";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Configuration tarifs - Admin RetroMuscle",
  description: "Gestion des tarifs par type de vidéo du programme créateur.",
  path: "/admin/config",
  noIndex: true
});

export default async function AdminConfigRoute() {
  await protectPage("/admin");

  const data = await getAdminConfigData();

  return <AdminConfigPage data={data} />;
}
