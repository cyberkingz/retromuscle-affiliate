import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CreatorHeader } from "@/features/creator-dashboard/components/creator-header";
import { CreatorProgressCard } from "@/features/creator-dashboard/components/creator-progress-card";
import { PaymentHistoryTable } from "@/features/creator-dashboard/components/payment-history-table";
import { PayoutBreakdownTable } from "@/features/creator-dashboard/components/payout-breakdown-table";
import { QuotasGrid } from "@/features/creator-dashboard/components/quotas-grid";
import { RushesSummaryCard } from "@/features/creator-dashboard/components/rushes-summary-card";
import { UploadCard } from "@/features/creator-dashboard/components/upload-card";
import { ActivityFeedCard } from "@/features/creator-dashboard/components/activity-feed-card";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";

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
        packageTier={data.plan.packageTier}
        mixLabel={data.plan.mixLabel}
        monthlyCreditsLabel={formatCurrency(data.plan.monthlyCredits)}
      />

      <CreatorProgressCard
        deliveredTotal={data.progress.deliveredTotal}
        quotaTotal={data.progress.quotaTotal}
        completionPercent={data.progress.completionPercent}
        remainingDetails={data.progress.remainingDetails}
        estimatedPayoutLabel={formatCurrency(data.progress.estimatedPayout)}
        deadlineLabel={toShortDate(data.plan.deadline)}
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <UploadCard
          monthlyTrackingId={data.upload.monthlyTrackingId}
          specs={data.upload.specs}
          tips={data.upload.tips}
          pendingReviewCount={data.upload.pendingReviewCount}
          rejectedCount={data.upload.rejectedCount}
          recentVideos={data.upload.recentVideos}
        />
        <RushesSummaryCard
          monthlyTrackingId={data.upload.monthlyTrackingId}
          totalFiles={data.rushes.totalFiles}
          totalSizeLabel={`${(data.rushes.totalSizeMb / 1024).toFixed(1)} GB`}
          rushes={data.rushes.recentRushes}
        />
      </div>

      <div className="text-center">
        <Link
          href="/uploads"
          className="text-sm font-semibold text-secondary underline underline-offset-4 hover:text-secondary/80"
        >
          Voir tous mes uploads
        </Link>
      </div>

      <details className="rounded-[22px] border border-line bg-white/85 p-4" open>
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Quotas par type ({data.quotasByType.length})
        </summary>
        <div className="pt-4">
          <QuotasGrid items={data.quotasByType} />
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
          Estimation par type
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
