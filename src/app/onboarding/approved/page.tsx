import { PageShell } from "@/components/layout/page-shell";
import { protectPage } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";
import { ApprovedWaitingScreen } from "@/features/apply/components/approved-waiting-screen";

export const metadata = createPageMetadata({
  title: "Candidature approuvée — RetroMuscle",
  description: "Ta candidature a été approuvée. Ton accès créateur est en cours de configuration.",
  path: "/onboarding/approved"
});

export default async function OnboardingApprovedPage() {
  await protectPage("/onboarding/approved");

  return (
    <PageShell currentPath="/onboarding/approved">
      <ApprovedWaitingScreen />
    </PageShell>
  );
}
