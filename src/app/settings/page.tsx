import { getCreatorSettingsData } from "@/application/use-cases/get-creator-settings-data";
import { PageShell } from "@/components/layout/page-shell";
import { getAuthSessionFromCookies, protectPageWithReturn } from "@/features/auth/server/route-guards";
import { findCreatorIdForUser } from "@/features/auth/server/resolve-auth-session";
import { CreatorSettingsPage } from "@/features/creator-settings/creator-settings-page";
import { redirect } from "next/navigation";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Settings RetroMuscle",
  description: "Mets a jour tes informations et tes preferences de paiement.",
  path: "/settings"
});

export default async function SettingsRoute() {
  await protectPageWithReturn("/dashboard", "/settings");
  const authSession = await getAuthSessionFromCookies();

  const creatorId =
    authSession?.role === "admin"
      ? undefined
      : (await findCreatorIdForUser({ userId: authSession?.userId, email: authSession?.email })) ?? undefined;

  if (!creatorId) {
    redirect("/onboarding");
  }

  const data = await getCreatorSettingsData({ creatorId });

  return (
    <PageShell currentPath="/settings">
      <CreatorSettingsPage data={data} />
    </PageShell>
  );
}
