import Link from "next/link";
import { AlertTriangle, Upload } from "lucide-react";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
import { CreatorKitSection } from "@/features/creator-dashboard/components/creator-kit-section";
import { PaymentHistoryTable } from "@/features/creator-dashboard/components/payment-history-table";
import { PayoutBreakdownTable } from "@/features/creator-dashboard/components/payout-breakdown-table";
import { ActivityFeedCard } from "@/features/creator-dashboard/components/activity-feed-card";
import { WelcomePromoModal } from "@/features/creator-dashboard/components/welcome-promo-modal";
import { formatCurrency } from "@/lib/currency";
import { monthToLabel } from "@/lib/date";
import { cn } from "@/lib/cn";

interface CreatorDashboardPageProps {
  data: CreatorDashboardData;
}

export function CreatorDashboardPage({ data }: CreatorDashboardPageProps) {
  const isNewCreator =
    data.progress.deliveredTotal === 0 &&
    data.upload.pendingReviewCount === 0 &&
    data.upload.revisionCount === 0 &&
    data.upload.rejectedCount === 0;

  const revisionVideos = data.upload.recentVideos.filter(
    (v) => v.status === "revision_requested"
  );

  return (
    <div className="space-y-5">
      {/* Post-contract welcome modal — shown once per creator, only when a code is ready */}
      <WelcomePromoModal
        contractSignedAt={data.creator.contractSignedAt}
        creatorId={data.creator.id}
        promoCode={data.creator.kitPromoCode}
      />

      {/* Welcome banner — compact 1-ligne, magenta gradient subtil, matches V2 HTML */}
      {isNewCreator && (
        <div
          className={
            "flex flex-col gap-3 rounded-2xl border border-primary/25 px-[18px] py-[14px] " +
            "bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] " +
            "sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          }
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              Prochaine étape
            </p>
            <p className="mt-[3px] font-display text-[18px] font-black uppercase leading-none text-secondary">
              Tu es dans le programme&nbsp;!
            </p>
            <p className="mt-[2px] text-[12px] text-secondary/60">
              Dépose ton premier contenu pour commencer à encaisser.
            </p>
          </div>

          <Link
            href="/uploads"
            className={
              "inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-[22px] " +
              "bg-secondary px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white " +
              "transition hover:bg-secondary/90 active:scale-95 sm:self-auto"
            }
          >
            Déposer
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}

      {/* Payout alert — full-width, above grid */}
      {!data.hasPayoutProfile && (
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
      )}

      {/*
        RESPONSIVE SPLIT LAYOUT
        ───────────────────────
        Mobile  (single col): items flow in DOM order
          1. Gains hero
          2. Upload CTA       ← primary action near top on mobile
          3. 3 stats
          4. Kit créateur
          5. Activity
          6. Accordion: gains par type
          7. Accordion: historique paiements

        Desktop (2 independent flex stacks, 1fr + 320px):
          Left:  Hero → 3 stats → Accordion gains → Accordion history
          Right: Upload CTA → Kit créateur → Activity

        Each column flows naturally, no forced row alignment → no empty gaps.
      */}

      {/* MOBILE: single flex-col with explicit order-N ordering.
          DESKTOP: 2-col grid, each column is its own flex-stack (no row alignment between cols). */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-4">

        {/* ═══ LEFT STACK ═══ contents on mobile (children flatten into outer flex), flex-col on desktop ═══ */}
        <div className="contents lg:flex lg:flex-col lg:gap-4">

        {/* ── 1. GAINS HERO ── mobile order 1 ── */}
        <div className="relative overflow-hidden rounded-[22px] bg-secondary p-6 text-white order-1 lg:order-none">
          {/* Decorative pink glow */}
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary opacity-10 blur-3xl" />
          {/* Decorative hash */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-4 right-4 select-none font-display text-[120px] font-black leading-none text-white/[0.04]"
          >
            #
          </span>

          <div className="relative mb-5 flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-black uppercase leading-none tracking-wide text-white">
                {data.creator.handle}
              </h1>
              <p className="mt-1.5 text-[12px] text-white/40">
                {data.creator.displayName} · {data.creator.country}
              </p>
              <span className="mt-2 inline-block rounded-full bg-mint/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-mint">
                {data.creator.status}
              </span>
            </div>
            <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
              {monthToLabel(data.month)}
            </span>
          </div>

          <p className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
            Gains estimés ce mois
          </p>
          <p className="relative mt-1 font-display text-[68px] font-black leading-none tracking-wide text-accent sm:text-[80px]">
            {formatCurrency(data.progress.estimatedPayout)}
          </p>
          <p className="relative mt-2 text-[12px] text-white/30">
            Virement mensuel · basé sur tes vidéos validées
          </p>
        </div>

        {/* ── 3. STATS ROW ── mobile order 3 (below upload CTA) · hidden on mobile (upload CTA shows inline stats) ── */}
        <div className="hidden order-3 grid-cols-3 gap-3 lg:order-none lg:grid">
          <div className="rounded-2xl border border-line bg-white/85 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/50">
              Approuvées
            </p>
            <p className="mt-1.5 font-display text-4xl font-black uppercase leading-none text-mint">
              {data.progress.deliveredTotal}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white/85 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/50">
              En revue
            </p>
            <p className="mt-1.5 font-display text-4xl font-black uppercase leading-none text-amber-500">
              {data.upload.pendingReviewCount}
            </p>
          </div>
          {data.upload.revisionCount > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-600/70">
                À refaire
              </p>
              <p className="mt-1.5 font-display text-4xl font-black uppercase leading-none text-amber-500">
                {data.upload.revisionCount}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-line bg-white/85 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/50">
                Rejetées
              </p>
              <p className="mt-1.5 font-display text-4xl font-black uppercase leading-none text-destructive">
                {data.upload.rejectedCount}
              </p>
            </div>
          )}
        </div>

        {/* ── 6. ACCORDION: GAINS PAR TYPE ── mobile order 6 ── */}
        <details className="rounded-[22px] border border-line bg-white/85 p-4 order-6 lg:order-none">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
            Gains par type
          </summary>
          <div className="pt-4">
            <PayoutBreakdownTable items={data.payoutBreakdown} />
          </div>
        </details>

        {/* ── 7. ACCORDION: HISTORIQUE ── mobile order 7 ── */}
        <details className="rounded-[22px] border border-line bg-white/85 p-4 order-7 lg:order-none">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
            Historique des paiements
          </summary>
          <div className="pt-4">
            <PaymentHistoryTable history={data.paymentHistory} />
          </div>
        </details>

        </div>
        {/* ═══ /LEFT STACK ═══ */}

        {/* ═══ RIGHT STACK ═══ contents on mobile, flex-col on desktop ═══ */}
        <div className="contents lg:flex lg:flex-col lg:gap-4">

        {/* ── 2a. REVISION CARD ── shown instead of / above upload CTA when revisions pending ── */}
        {revisionVideos.length > 0 && (
          <div className="rounded-[20px] border border-amber-300/60 bg-amber-50 p-5 order-2 lg:order-none">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600/70">
              Action requise
            </p>
            <p className="mt-1 font-display text-[20px] font-black uppercase leading-tight text-amber-800">
              {revisionVideos.length === 1 ? "1 vidéo à corriger" : `${revisionVideos.length} vidéos à corriger`}
            </p>
            {revisionVideos[0]?.rejectionReason && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-white/60 px-3 py-2.5">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">
                  Ce qu&apos;on te demande
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-900">
                  {revisionVideos[0].rejectionReason}
                  {revisionVideos.length > 1 && (
                    <span className="mt-0.5 block text-[11px] text-amber-600/60">
                      +{revisionVideos.length - 1} autre{revisionVideos.length > 2 ? "s" : ""} sur la page Uploads
                    </span>
                  )}
                </p>
              </div>
            )}
            <Link
              href="/uploads"
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-amber-600 active:scale-95"
            >
              <Upload className="h-3.5 w-3.5" />
              Corriger et re-uploader
            </Link>
          </div>
        )}

        {/* ── 2. UPLOAD CTA ── mobile order 2 ── */}
        <Link
          href="/uploads"
          className={cn(
            "group rounded-[20px] bg-primary p-5 text-white transition hover:bg-primary/90 lg:order-none",
            revisionVideos.length > 0 ? "order-3" : "order-2"
          )}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
            Action principale
          </p>
          <p className="mt-1.5 font-display text-[22px] font-black uppercase leading-tight">
            Uploader une vidéo
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-white/55">
            Choisis le type, dépose ton contenu. Validation sous&nbsp;48h.
          </p>

          {/* Inline stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/10 px-2 py-2">
              <p className="font-display text-xl font-black leading-none text-white">
                {data.progress.deliveredTotal}
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-white/50">
                Approuvées
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2">
              <p className="font-display text-xl font-black leading-none text-white">
                {data.upload.pendingReviewCount}
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-white/50">
                En revue
              </p>
            </div>
            <div className="rounded-xl bg-white/10 px-2 py-2">
              <p className="font-display text-xl font-black leading-none text-white">
                {data.upload.revisionCount > 0
                  ? data.upload.revisionCount
                  : data.upload.rejectedCount}
              </p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-white/50">
                {data.upload.revisionCount > 0 ? "À refaire" : "Rejetées"}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-primary transition group-hover:bg-white/90">
            <Upload className="h-3.5 w-3.5" />
            Uploader maintenant
          </div>
        </Link>

        {/* ── 4. KIT CRÉATEUR ── mobile order 4 ── */}
        {data.creator.contractSignedAt && (
          <div className="order-4 lg:order-none">
            <CreatorKitSection
              contractSignedAt={data.creator.contractSignedAt}
              kitStatus={data.creator.kitStatus}
              promoCode={data.creator.kitPromoCode}
            />
          </div>
        )}

        {/* ── 5. ACTIVITY ── mobile order 5 ── */}
        <div className="order-5 lg:order-none">
          <ActivityFeedCard items={data.activity} />
        </div>

        </div>
        {/* ═══ /RIGHT STACK ═══ */}

      </div>
    </div>
  );
}
