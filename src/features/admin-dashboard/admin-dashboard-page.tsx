"use client";

import { useRouter } from "next/navigation";
import type { AdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { AdminMetricsStrip } from "@/features/admin-dashboard/components/admin-metrics-strip";
import { CreatorsMasterTable } from "@/features/admin-dashboard/components/creators-master-table";
import { MonthlyTrackingTable } from "@/features/admin-dashboard/components/monthly-tracking-table";
import { PaymentsTable } from "@/features/admin-dashboard/components/payments-table";
import { ValidationQueue } from "@/features/admin-dashboard/components/validation-queue";
import { monthToLabel } from "@/lib/date";
import { ChevronDown } from "lucide-react";

interface AdminDashboardPageProps {
  data: AdminDashboardData;
}

export function AdminDashboardPage({ data }: AdminDashboardPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl uppercase leading-none sm:text-3xl">Opérations</h1>
        {data.availableMonths.length > 1 ? (
          <select
            value={data.month}
            onChange={(event) => router.push(`/admin?month=${event.target.value}`)}
            className="h-8 rounded-xl border border-line bg-white px-3 text-sm capitalize"
            aria-label="Sélectionner le mois"
          >
            {data.availableMonths.map((m) => (
              <option key={m} value={m}>
                {monthToLabel(m)}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm text-foreground/75">{monthToLabel(data.month)}</span>
        )}
      </div>

      {/* Metrics */}
      <AdminMetricsStrip {...data.metrics} />

      {/* Validation Queue — full width */}
      <ValidationQueue rows={data.validationQueue} />

      {/* Payments — full width */}
      <PaymentsTable month={data.month} rows={data.payments} />

      {/* Collapsible sections — divider style, not card-like */}
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between border-t border-line px-1 pb-2 pt-4 text-sm font-semibold uppercase tracking-[0.12em] text-foreground/60 hover:text-foreground">
          <span>Créateurs ({data.creatorsMaster.length})</span>
          <ChevronDown className="h-4 w-4 text-foreground/60 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="mt-3">
          <CreatorsMasterTable rows={data.creatorsMaster} />
        </div>
      </details>

      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between border-t border-line px-1 pb-2 pt-4 text-sm font-semibold uppercase tracking-[0.12em] text-foreground/60 hover:text-foreground">
          <span>Tracking mensuel ({data.monthlyRows.length})</span>
          <ChevronDown className="h-4 w-4 text-foreground/60 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="mt-3">
          <MonthlyTrackingTable rows={data.monthlyRows} />
        </div>
      </details>
    </div>
  );
}
