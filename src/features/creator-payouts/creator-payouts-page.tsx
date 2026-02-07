import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { PaymentHistoryTable } from "@/features/creator-dashboard/components/payment-history-table";
import { PayoutBreakdownTable } from "@/features/creator-dashboard/components/payout-breakdown-table";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";

interface CreatorPayoutsPageProps {
  data: CreatorDashboardData;
}

export function CreatorPayoutsPage({ data }: CreatorPayoutsPageProps) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Paiements"
        title="Ton recap revenus"
        subtitle="Estimation du cycle en cours et historique mensuel."
      />

      <CardSection>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Cycle {monthToLabel(data.month)}</p>
            <p className="mt-2 font-display text-5xl uppercase leading-none text-secondary">
              {formatCurrency(data.progress.estimatedPayout)}
            </p>
            <p className="mt-2 text-sm text-foreground/75">
              Estimation basee sur les livrables valides du mois (et credits mensuels inclus).
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-frost/60 p-4 text-sm text-foreground/75">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Deadline</p>
            <p className="mt-2 font-medium">{toShortDate(data.plan.deadline)}</p>
            <p className="mt-2">{data.progress.remainingDetails}</p>
          </div>
        </div>
      </CardSection>

      <PayoutBreakdownTable items={data.payoutBreakdown} />
      <PaymentHistoryTable history={data.paymentHistory} />
    </div>
  );
}

