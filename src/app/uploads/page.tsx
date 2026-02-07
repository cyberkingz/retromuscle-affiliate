import { getCreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { PageShell } from "@/components/layout/page-shell";
import { getAuthSessionFromCookies, protectPageWithReturn } from "@/features/auth/server/route-guards";
import { findCreatorIdForUser } from "@/features/auth/server/resolve-auth-session";
import { CreatorUploadsPage } from "@/features/creator-uploads/creator-uploads-page";
import { parseMonthParam } from "@/lib/validation";
import { redirect } from "next/navigation";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Uploads RetroMuscle",
  description: "Depose tes contenus, suis les validations, et re-upload si besoin.",
  path: "/uploads"
});

interface UploadsRouteProps {
  searchParams?: Promise<{
    month?: string;
  }>;
}

export default async function UploadsRoute({ searchParams }: UploadsRouteProps) {
  await protectPageWithReturn("/dashboard", "/uploads");
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
    <PageShell currentPath="/uploads">
      <CreatorUploadsPage data={data} />
    </PageShell>
  );
}
