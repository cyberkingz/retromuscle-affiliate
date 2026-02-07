import { createPageMetadata } from "@/app/_lib/metadata";
import { getAdminCreatorDetailData } from "@/application/use-cases/get-admin-creator-detail-data";
import { protectPage } from "@/features/auth/server/route-guards";
import { AdminCreatorDetailPage } from "@/features/admin-creators/admin-creator-detail-page";
import { isUuid } from "@/lib/validation";
import { notFound } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Admin Creator Detail",
  description: "Detail createur: profil, uploads, quotas, paiements, contrat.",
  path: "/admin/creators"
});

interface AdminCreatorDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCreatorDetailRoute({ params }: AdminCreatorDetailRouteProps) {
  await protectPage("/admin");
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const data = await getAdminCreatorDetailData({ creatorId: id });
  return <AdminCreatorDetailPage data={data} />;
}

