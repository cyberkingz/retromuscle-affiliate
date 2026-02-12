import type { AdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { AdminMetricsStrip } from "@/features/admin-dashboard/components/admin-metrics-strip";
import { CreatorsMasterTable } from "@/features/admin-dashboard/components/creators-master-table";
import { MonthlyTrackingTable } from "@/features/admin-dashboard/components/monthly-tracking-table";
import { PaymentsTable } from "@/features/admin-dashboard/components/payments-table";
import { ValidationQueue } from "@/features/admin-dashboard/components/validation-queue";
import { monthToLabel } from "@/lib/date";
import Link from "next/link";
import type { Route } from "next";

interface AdminDashboardPageProps {
  data: AdminDashboardData;
}

export function AdminDashboardPage({ data }: AdminDashboardPageProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Manager"
          title="Operations"
          subtitle={monthToLabel(data.month)}
        />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="pill" variant="outline">
            <Link href={"/admin/applications" as Route}>Candidatures</Link>
          </Button>
          <Button asChild size="pill" variant="outline">
            <a href={`/api/admin/payments/export?month=${encodeURIComponent(data.month)}`} target="_blank" rel="noreferrer">
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      <AdminMetricsStrip {...data.metrics} />

      <div className="grid gap-5 lg:grid-cols-2">
        <ValidationQueue rows={data.validationQueue} />
        <PaymentsTable month={data.month} rows={data.payments} />
      </div>

      <details className="rounded-[22px] border border-line bg-white/85 p-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Createurs ({data.creatorsMaster.length})
        </summary>
        <div className="pt-4">
          <CreatorsMasterTable rows={data.creatorsMaster} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Tracking mensuel ({data.monthlyRows.length})
        </summary>
        <div className="pt-4">
          <MonthlyTrackingTable rows={data.monthlyRows} />
        </div>
      </details>
    </div>
  );
}
