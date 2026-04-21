import { getAdminContentData } from "@/application/use-cases/get-admin-content-data";
import { AdminContentPage } from "@/features/admin-content/admin-content-page";
import { protectPage } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Admin Contenu RetroMuscle",
  description: "Vue d'ensemble de tout le contenu créateur reçu.",
  path: "/admin/content",
  noIndex: true
});

export default async function AdminContentRoute() {
  await protectPage("/admin");
  const data = await getAdminContentData();
  return <AdminContentPage data={data} />;
}
