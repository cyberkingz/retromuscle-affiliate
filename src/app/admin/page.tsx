import { getAdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { protectPage } from "@/features/auth/server/route-guards";
import { AdminDashboardPage } from "@/features/admin-dashboard/admin-dashboard-page";
import { parseMonthParam } from "@/lib/validation";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Admin RetroMuscle",
  description: "Operations: suivi des quotas, validation des contenus, gestion des paiements.",
  path: "/admin"
});

interface AdminRouteProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function AdminRoute({ searchParams }: AdminRouteProps) {
  await protectPage("/admin");

  const params = searchParams ? await searchParams : undefined;
  let month: string | undefined;
  try {
    month = parseMonthParam(params?.month);
  } catch {
    month = undefined;
  }

  const data = await getAdminDashboardData({ month });

  return <AdminDashboardPage data={data} />;
}
