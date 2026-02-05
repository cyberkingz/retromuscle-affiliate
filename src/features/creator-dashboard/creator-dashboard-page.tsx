import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CreatorHeader } from "@/features/creator-dashboard/components/creator-header";
import { CreatorProgressCard } from "@/features/creator-dashboard/components/creator-progress-card";
import { PaymentHistoryTable } from "@/features/creator-dashboard/components/payment-history-table";
import { PayoutBreakdownTable } from "@/features/creator-dashboard/components/payout-breakdown-table";
import { QuotasGrid } from "@/features/creator-dashboard/components/quotas-grid";
import { RushesSummaryCard } from "@/features/creator-dashboard/components/rushes-summary-card";
import { UploadCard } from "@/features/creator-dashboard/components/upload-card";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel, toShortDate } from "@/lib/date";

interface CreatorDashboardPageProps {
  data: CreatorDashboardData;
}

export function CreatorDashboardPage({ data }: CreatorDashboardPageProps) {
  return (
    <div className="space-y-6">
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

      <QuotasGrid items={data.quotasByType} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <UploadCard
          monthlyTrackingId={data.upload.monthlyTrackingId}
          specs={data.upload.specs}
          tips={data.upload.tips}
          pendingReviewCount={data.upload.pendingReviewCount}
          rejectedCount={data.upload.rejectedCount}
          recentVideos={data.upload.recentVideos}
        />
        <RushesSummaryCard
          totalFiles={data.rushes.totalFiles}
          totalSizeLabel={`${(data.rushes.totalSizeMb / 1024).toFixed(1)} GB`}
        />
      </div>

      <PayoutBreakdownTable items={data.payoutBreakdown} />
      <PaymentHistoryTable history={data.paymentHistory} />
    </div>
  );
}
