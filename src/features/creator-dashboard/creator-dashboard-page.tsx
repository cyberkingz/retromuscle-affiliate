import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CardSection } from "@/components/layout/card-section";
import { CreatorHeader } from "@/features/creator-dashboard/components/creator-header";
import { CreatorProgressCard } from "@/features/creator-dashboard/components/creator-progress-card";
import { PaymentHistoryTable } from "@/features/creator-dashboard/components/payment-history-table";
import { PayoutBreakdownTable } from "@/features/creator-dashboard/components/payout-breakdown-table";
import { QuotasGrid } from "@/features/creator-dashboard/components/quotas-grid";
import { ActivityFeedCard } from "@/features/creator-dashboard/components/activity-feed-card";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel } from "@/lib/date";

interface CreatorDashboardPageProps {
  data: CreatorDashboardData;
}

export function CreatorDashboardPage({ data }: CreatorDashboardPageProps) {
  return (
    <div className="space-y-8">
      {!data.hasPayoutProfile ? (
        <div
          className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 px-5 py-4 text-sm text-amber-900"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p>
            Configure ton moyen de paiement pour recevoir tes revenus.{" "}
            <Link
              href="/settings"
              className="font-semibold underline underline-offset-4 hover:text-amber-700"
            >
              Aller dans les parametres
            </Link>
          </p>
        </div>
      ) : null}

      <CreatorHeader
        handle={data.creator.handle}
        displayName={data.creator.displayName}
        country={data.creator.country}
        status={data.creator.status}
        monthLabel={monthToLabel(data.month)}
      />

      <CreatorProgressCard
        deliveredTotal={data.progress.deliveredTotal}
        estimatedPayoutLabel={formatCurrency(data.progress.estimatedPayout)}
        pendingReviewCount={data.upload.pendingReviewCount}
      />

      <CardSection className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/55">Uploads & validation</p>
            <p className="mt-1 text-sm text-foreground/70">
              Depose tes videos, suis les validations, puis re-upload si besoin.
            </p>
          </div>
          <Link
            href="/uploads"
            className="inline-flex h-10 items-center justify-center rounded-full border border-secondary/45 bg-secondary px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-secondary/90"
          >
            Aller aux uploads
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">A valider</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none text-foreground/85">
              {data.upload.pendingReviewCount}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Approuvees</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none text-mint">
              {data.progress.deliveredTotal}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/55">Rejetees</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none text-destructive">
              {data.upload.rejectedCount}
            </p>
          </div>
        </div>
      </CardSection>

      <details className="rounded-[22px] border border-line bg-white/85 p-4" open>
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Detail par type ({data.deliveredByType.length})
        </summary>
        <div className="pt-4">
          <QuotasGrid items={data.deliveredByType} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Activite recente ({data.activity.length})
        </summary>
        <div className="pt-4">
          <ActivityFeedCard items={data.activity} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Gains par type
        </summary>
        <div className="pt-4">
          <PayoutBreakdownTable items={data.payoutBreakdown} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Historique des paiements
        </summary>
        <div className="pt-4">
          <PaymentHistoryTable history={data.paymentHistory} />
        </div>
      </details>
    </div>
  );
}
