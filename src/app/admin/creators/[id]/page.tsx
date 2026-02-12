import { createPageMetadata } from "@/app/_lib/metadata";
import { getAdminCreatorDetailData } from "@/application/use-cases/get-admin-creator-detail-data";
import { protectPage } from "@/features/auth/server/route-guards";
import { AdminCreatorDetailPage } from "@/features/admin-creators/admin-creator-detail-page";
import { isUuid, parseMonthParam } from "@/lib/validation";
import { notFound } from "next/navigation";

export const metadata = createPageMetadata({
  title: "Admin Creator Detail",
  description: "Detail createur: profil, uploads, quotas, paiements, contrat.",
  path: "/admin/creators",
  noIndex: true
});

interface AdminCreatorDetailRouteProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ month?: string }>;
}

export default async function AdminCreatorDetailRoute({ params, searchParams }: AdminCreatorDetailRouteProps) {
  await protectPage("/admin");
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!isUuid(id)) {
    notFound();
  }

  let month: string | undefined;
  try {
    month = parseMonthParam(resolvedSearchParams?.month);
  } catch {
    month = undefined;
  }

  const data = await getAdminCreatorDetailData({ creatorId: id, month });
  return (
    <AdminCreatorDetailPage data={data} creatorId={id} />
  );
}

