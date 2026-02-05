import { getCreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { PageShell } from "@/components/layout/page-shell";
import { getAuthSessionFromCookies, protectPage } from "@/features/auth/server/route-guards";
import { findCreatorIdForUser } from "@/features/auth/server/resolve-auth-session";
import { CreatorDashboardPage } from "@/features/creator-dashboard/creator-dashboard-page";
import { parseMonthParam } from "@/lib/validation";
import { redirect } from "next/navigation";

interface DashboardRouteProps {
  searchParams?: {
    creator?: string;
    month?: string;
  };
}

export default async function DashboardRoute({ searchParams }: DashboardRouteProps) {
  await protectPage("/dashboard");
  const authSession = await getAuthSessionFromCookies();

  let month: string | undefined;
  try {
    month = parseMonthParam(searchParams?.month);
  } catch {
    month = undefined;
  }

  let creatorId = searchParams?.creator;
  if (authSession?.role !== "admin") {
    creatorId =
      (await findCreatorIdForUser({ userId: authSession?.userId, email: authSession?.email })) ??
      undefined;
  }

  if (!creatorId) {
    redirect("/onboarding");
  }

  const data = await getCreatorDashboardData({
    creatorId,
    month
  });

  return (
    <PageShell currentPath="/dashboard">
      <CreatorDashboardPage data={data} />
    </PageShell>
  );
}
