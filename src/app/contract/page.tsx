import { PageShell } from "@/components/layout/page-shell";
import { ContractPage } from "@/features/contract/contract-page";
import { protectPage } from "@/features/auth/server/route-guards";
import { createPageMetadata } from "@/app/_lib/metadata";

export const metadata = createPageMetadata({
  title: "Signature du contrat RetroMuscle",
  description: "Lis et signe le contrat pour activer tes missions et la cession des droits d'utilisation.",
  path: "/contract"
});

export default async function ContractRoute() {
  await protectPage("/contract");

  return (
    <PageShell currentPath="/contract">
      <ContractPage />
    </PageShell>
  );
}
