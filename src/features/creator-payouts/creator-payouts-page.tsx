"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CardSection } from "@/components/layout/card-section";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaymentHistoryTable } from "@/features/creator-dashboard/components/payment-history-table";
import { PayoutBreakdownTable } from "@/features/creator-dashboard/components/payout-breakdown-table";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";
import { paymentStatusTone } from "@/lib/status-tone";

interface CreatorPayoutsPageProps {
  data: CreatorDashboardData;
}

export function CreatorPayoutsPage({ data }: CreatorPayoutsPageProps) {
  const router = useRouter();

  const currentMonthPayment = data.paymentHistory.find((h) => h.month === data.month);
  const currentPaymentStatus = currentMonthPayment?.paymentStatus ?? "A faire";

  const availableMonths = data.paymentHistory
    .map((h) => h.month)
    .sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Paiements"
        title="Ton recap revenus"
        subtitle="Estimation du cycle en cours et historique mensuel."
      />

      {/* Payout profile warning */}
      {!data.hasPayoutProfile ? (
        <div className="rounded-2xl border border-secondary/40 bg-secondary/10 px-4 py-4" role="alert">
          <p className="text-sm font-semibold text-foreground/90">
            Profil de paiement non configure
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            Pour recevoir tes paiements, renseigne tes coordonnees bancaires dans les parametres.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-flex rounded-full border border-secondary bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-foreground/80 transition-colors hover:bg-secondary/20"
          >
            Configurer mon profil de paiement
          </Link>
        </div>
      ) : null}

      {/* Month navigation */}
      {availableMonths.length > 1 ? (
        <CardSection className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Periode</p>
            <select
              value={data.month}
              onChange={(event) => {
                const month = event.target.value;
                router.push(`/payouts?month=${month}`);
              }}
              className="h-9 rounded-xl border border-line bg-white px-3 text-sm capitalize"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {monthToLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </CardSection>
      ) : null}

      {/* Current month payout - prominent */}
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
            <div className="mt-3 flex items-center gap-3">
              <StatusBadge label={currentPaymentStatus} tone={paymentStatusTone(currentPaymentStatus)} />
              {currentMonthPayment?.paidAt ? (
                <span className="text-xs text-foreground/60">
                  Paye le {toShortDate(currentMonthPayment.paidAt)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-frost/60 p-4 text-sm text-foreground/75">
            <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Deadline</p>
            <p className="mt-2 font-medium">{toShortDate(data.plan.deadline)}</p>
            <p className="mt-2">{data.progress.remainingDetails}</p>
          </div>
        </div>
      </CardSection>

      {/* Current month stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Videos livrees</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-foreground/80">
            {data.progress.deliveredTotal}/{data.progress.quotaTotal}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Completion</p>
          <p className="mt-1 font-display text-3xl uppercase leading-none text-mint">
            {data.progress.completionPercent}%
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white/95 px-4 py-4 text-center">
          <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Pack</p>
          <p className="mt-1 font-display text-2xl uppercase leading-none text-foreground/80">
            {data.plan.mixLabel}
          </p>
          <p className="mt-1 text-xs text-foreground/55">Tier {data.plan.packageTier}</p>
        </div>
      </div>

      <PayoutBreakdownTable items={data.payoutBreakdown} />
      <PaymentHistoryTable history={data.paymentHistory} />
    </div>
  );
}
