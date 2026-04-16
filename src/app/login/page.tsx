import { getApplyPageData } from "@/application/use-cases/get-apply-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { LoginPage } from "@/features/apply/login-page";
import { redirectAuthenticatedUserFromPublicAuthPages } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Connexion Programme Créateur RetroMuscle",
  description:
    "Connecte-toi pour accéder à ton espace créateur, uploader tes vidéos et suivre tes gains.",
  path: "/login",
  noIndex: true
});

export default async function LoginRoute() {
  await redirectAuthenticatedUserFromPublicAuthPages();
  const data = await getApplyPageData();

  return (
    <PageShell currentPath="/login">
      <LoginPage marketing={data.marketing} />
    </PageShell>
  );
}
