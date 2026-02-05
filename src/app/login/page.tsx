import { getApplyPageData } from "@/application/use-cases/get-apply-page-data";
import { PageShell } from "@/components/layout/page-shell";
import { LoginPage } from "@/features/apply/login-page";
import { redirectAuthenticatedUserFromPublicAuthPages } from "@/features/auth/server/route-guards";

export default async function LoginRoute() {
  await redirectAuthenticatedUserFromPublicAuthPages();
  const data = await getApplyPageData();

  return (
    <PageShell currentPath="/login">
      <LoginPage marketing={data.marketing} />
    </PageShell>
  );
}
