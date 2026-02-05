import { PageShell } from "@/components/layout/page-shell";
import { OnboardingFlow } from "@/features/apply/onboarding-flow";
import { protectPage } from "@/features/auth/server/route-guards";

export default async function OnboardingPage() {
  await protectPage("/onboarding");

  return (
    <PageShell currentPath="/onboarding">
      <OnboardingFlow />
    </PageShell>
  );
}
