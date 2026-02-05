import { getAdminApplicationsData } from "@/application/use-cases/get-admin-applications-data";
import { PageShell } from "@/components/layout/page-shell";
import { AdminApplicationsPage } from "@/features/admin-applications/admin-applications-page";
import { protectPage } from "@/features/auth/server/route-guards";

export default async function AdminApplicationsRoute() {
  await protectPage("/admin");
  const data = await getAdminApplicationsData();

  return (
    <PageShell currentPath="/admin/applications">
      <AdminApplicationsPage data={data} />
    </PageShell>
  );
}
