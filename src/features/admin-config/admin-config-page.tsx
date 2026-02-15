import type { AdminConfigData } from "@/application/use-cases/get-admin-config-data";
import { PackagesTable } from "@/features/admin-config/components/packages-table";
import { RatesTable } from "@/features/admin-config/components/rates-table";
import { MixesTable } from "@/features/admin-config/components/mixes-table";

interface AdminConfigPageProps {
  data: AdminConfigData;
}

export function AdminConfigPage({ data }: AdminConfigPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl uppercase leading-none text-secondary">
          Configuration des offres
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Gere les packs, tarifs et styles de contenu du programme createur.
        </p>
      </div>

      <PackagesTable packages={data.packages} />
      <RatesTable rates={data.rates} />
      <MixesTable mixes={data.mixes} />
    </div>
  );
}
