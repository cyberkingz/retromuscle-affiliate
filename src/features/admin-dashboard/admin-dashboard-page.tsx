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
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Manager"
        title="Operations programme"
        subtitle={`Pilotage ${monthToLabel(data.month)}: suivi, validation, paiement.`}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild size="pill" variant="outline">
          <Link href={"/admin/applications" as Route}>Candidatures</Link>
        </Button>
      </div>

      <AdminMetricsStrip {...data.metrics} />

      <CreatorsMasterTable rows={data.creatorsMaster} />
      <MonthlyTrackingTable rows={data.monthlyRows} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ValidationQueue rows={data.validationQueue} />
        <PaymentsTable month={data.month} rows={data.payments} />
      </div>
    </div>
  );
}
