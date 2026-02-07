import { getCreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { PageShell } from "@/components/layout/page-shell";
import { getAuthSessionFromCookies, protectPageWithReturn } from "@/features/auth/server/route-guards";
import { findCreatorIdForUser } from "@/features/auth/server/resolve-auth-session";
import { CreatorPayoutsPage } from "@/features/creator-payouts/creator-payouts-page";
import { parseMonthParam } from "@/lib/validation";
import { redirect } from "next/navigation";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Paiements RetroMuscle",
  description: "Estimation du cycle en cours et historique mensuel.",
  path: "/payouts"
});

interface PayoutsRouteProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function PayoutsRoute({ searchParams }: PayoutsRouteProps) {
  await protectPageWithReturn("/dashboard", "/payouts");
  const authSession = await getAuthSessionFromCookies();
  const params = searchParams ? await searchParams : undefined;

  let month: string | undefined;
  try {
    month = parseMonthParam(params?.month);
  } catch {
    month = undefined;
  }

  const creatorId =
    authSession?.role === "admin"
      ? undefined
      : (await findCreatorIdForUser({ userId: authSession?.userId, email: authSession?.email })) ?? undefined;

  if (!creatorId) {
    redirect("/onboarding");
  }

  const data = await getCreatorDashboardData({ creatorId, month });

  return (
    <PageShell currentPath="/payouts">
      <CreatorPayoutsPage data={data} />
    </PageShell>
  );
}
