import { getAdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import { AdminApplicationsPage } from "@/features/admin-applications/admin-applications-page";
import { protectPage } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Admin Candidatures RetroMuscle",
  description:
    "Valide les dossiers créateur, ajoute un feedback, et déclenche l'accès au dashboard.",
  path: "/admin/applications",
  noIndex: true
});

export default async function AdminApplicationsRoute() {
  await protectPage("/admin");
  const data = await getAdminApplicationsData();

  return <AdminApplicationsPage data={data} />;
}
