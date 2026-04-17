import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CardSection } from "@/components/layout/card-section";
import { CreatorHeader } from "@/features/creator-dashboard/components/creator-header";
import { CreatorKitSection } from "@/features/creator-dashboard/components/creator-kit-section";
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
  const isNewCreator =
    data.progress.deliveredTotal === 0 &&
    data.upload.pendingReviewCount === 0 &&
    data.upload.rejectedCount === 0;

  return (
    <div className="space-y-8">
      {isNewCreator && (
        <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/10 to-secondary/5 p-5">
          <p className="text-xs uppercase tracking-[0.15em] text-secondary/80">Prochaine étape</p>
          <p className="mt-2 font-display text-xl uppercase text-secondary">
            Tu es dans le programme&nbsp;!
          </p>
          <p className="mt-2 text-sm text-foreground/75">
            Tu n&apos;as pas encore d&apos;upload ce mois-ci. Dépose ton premier contenu dès
            maintenant pour commencer à encaisser.
          </p>
          <Link
            href="/uploads"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-secondary px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-secondary/90"
          >
            Déposer mon premier contenu
          </Link>
        </div>
      )}
      <CreatorKitSection contractSignedAt={data.creator.contractSignedAt} />

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
              Aller dans les paramètres
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
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/70">
              Uploads & validation
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              Dépose tes vidéos, suis les validations, puis re-upload si besoin.
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
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/70">À valider</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none text-foreground/85">
              {data.upload.pendingReviewCount}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/70">Approuvées</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none text-mint">
              {data.progress.deliveredTotal}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-frost/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-foreground/70">Rejetées</p>
            <p className="mt-1 font-display text-2xl uppercase leading-none text-destructive">
              {data.upload.rejectedCount}
            </p>
          </div>
        </div>
      </CardSection>

      <details className="rounded-[22px] border border-line bg-white/85 p-4" open>
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Détail par type ({data.deliveredByType.length})
        </summary>
        <div className="pt-4">
          <QuotasGrid items={data.deliveredByType} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4" open>
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Activité récente ({data.activity.length})
        </summary>
        <div className="pt-4">
          <ActivityFeedCard items={data.activity} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4" open>
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          Gains par type
        </summary>
        <div className="pt-4">
          <PayoutBreakdownTable items={data.payoutBreakdown} />
        </div>
      </details>

      <details className="rounded-[22px] border border-line bg-white/85 p-4" open>
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
