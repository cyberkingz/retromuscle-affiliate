import { PageShell } from "@/components/layout/page-shell";
import { ContractPage } from "@/features/contract/contract-page";
import { protectPage } from "@/features/auth/server/route-guards";

export default async function ContractRoute() {
  await protectPage("/contract");

  return (
    <PageShell currentPath="/contract">
      <ContractPage />
    </PageShell>
  );
}

