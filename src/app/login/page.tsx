import { PageShell } from "@/components/layout/page-shell";
import { LoginPage } from "@/features/apply/login-page";
import { redirectAuthenticatedUserFromPublicAuthPages } from "@/features/auth/server/route-guards";

export default async function LoginRoute() {
  await redirectAuthenticatedUserFromPublicAuthPages();

  return (
    <PageShell currentPath="/login">
      <LoginPage />
    </PageShell>
  );
}
