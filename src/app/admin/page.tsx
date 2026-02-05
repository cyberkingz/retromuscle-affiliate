import { getAdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { PageShell } from "@/components/layout/page-shell";
import { protectPage } from "@/features/auth/server/route-guards";
import { AdminDashboardPage } from "@/features/admin-dashboard/admin-dashboard-page";
import { parseMonthParam } from "@/lib/validation";

interface AdminRouteProps {
  searchParams?: {
    month?: string;
  };
}

export default async function AdminRoute({ searchParams }: AdminRouteProps) {
  await protectPage("/admin");

  let month: string | undefined;
  try {
    month = parseMonthParam(searchParams?.month);
  } catch {
    month = undefined;
  }

  const data = await getAdminDashboardData({ month });

  return (
    <PageShell currentPath="/admin">
      <AdminDashboardPage data={data} />
    </PageShell>
  );
}
