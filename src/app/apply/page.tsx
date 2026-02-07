import { getApplyPageData } from "@/application/use-cases/get-apply-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { SignupPage } from "@/features/apply/signup-page";
import { redirectAuthenticatedUserFromPublicAuthPages } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Inscription Programme Affilie RetroMuscle",
  description: "Cree ton compte et candidate au programme: missions mensuelles, validation rapide, paiements reguliers.",
  path: "/apply"
});

export default async function ApplyPage() {
  await redirectAuthenticatedUserFromPublicAuthPages();
  const data = await getApplyPageData();

  return (
    <PageShell currentPath="/apply">
      <SignupPage marketing={data.marketing} />
    </PageShell>
  );
}
