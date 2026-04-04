import type { AdminConfigData } from "@/application/use-cases/get-admin-config-data";
import { RatesTable } from "@/features/admin-config/components/rates-table";

interface AdminConfigPageProps {
  data: AdminConfigData;
}

export function AdminConfigPage({ data }: AdminConfigPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl uppercase leading-none text-secondary">
          Configuration des tarifs
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Gere les tarifs par type de video du programme createur.
        </p>
      </div>

      <RatesTable rates={data.rates} />
    </div>
  );
}
