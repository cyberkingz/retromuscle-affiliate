"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, TrendingUp } from "lucide-react";

import type { CreatorDashboardData } from "@/application/use-cases/get-creator-dashboard-data";
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
  const currentPaymentStatus = currentMonthPayment?.paymentStatus ?? "a_faire";

  const availableMonths = data.paymentHistory
    .map((h) => h.month)
    .sort((a, b) => b.localeCompare(a));

  const isPaid = currentPaymentStatus === "paye";

  return (
    <div className="space-y-4">

      {/* ── Payout profile warning ── */}
      {!data.hasPayoutProfile && (
        <div
          className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-50 px-5 py-4 text-sm text-amber-900"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="flex-1">
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

      {/* ── Hero card — navy, big number ── */}
      <div className="relative overflow-hidden rounded-[22px] bg-secondary p-6 text-white">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-primary opacity-10 blur-3xl" />
        {/* Watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 right-4 select-none font-display text-[120px] font-black leading-none text-white/[0.04]"
        >
          €
        </span>

        {/* Top row: handle + month badge */}
        <div className="relative mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
              Paiements
            </p>
            <h1 className="mt-[3px] font-display text-2xl font-black uppercase leading-none tracking-wide text-white">
              {data.creator.handle}
            </h1>
          </div>

          {/* Month selector — inline in hero */}
          {availableMonths.length > 1 ? (
            <select
              value={data.month}
              onChange={(event) => router.push(`/payouts?month=${event.target.value}`)}
              aria-label="Sélectionner la période"
              className="h-8 rounded-full border border-white/20 bg-white/10 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur-sm transition hover:bg-white/15"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="text-foreground capitalize bg-white">
                  {monthToLabel(m)}
                </option>
              ))}
            </select>
          ) : (
            <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
              {monthToLabel(data.month)}
            </span>
          )}
        </div>

        {/* Big payout number */}
        <p className="relative text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">
          Gains estimés ce mois
        </p>
        <p className="relative mt-1 font-display text-[68px] font-black leading-none tracking-wide text-accent sm:text-[80px]">
          {formatCurrency(data.progress.estimatedPayout)}
        </p>
        <p className="relative mt-2 text-[12px] text-white/30">
          Basé sur tes vidéos validées · virement mensuel
        </p>

        {/* Status + paid date */}
        <div className="relative mt-4 flex flex-wrap items-center gap-3">
          <StatusBadge
            label={currentPaymentStatus}
            tone={paymentStatusTone(currentPaymentStatus)}
          />
          {isPaid && currentMonthPayment?.paidAt && (
            <span className="text-[12px] text-white/50">
              Viré le {toShortDate(currentMonthPayment.paidAt)}
            </span>
          )}
        </div>

        {/* 3 stat tiles */}
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <StatTile
            label="Validées"
            value={data.progress.deliveredTotal}
            color="text-accent"
          />
          <StatTile
            label="En revue"
            value={data.upload.pendingReviewCount}
            color="text-amber-300"
          />
          <StatTile
            label="Rejetées"
            value={data.upload.rejectedCount}
            color="text-red-300"
          />
        </div>
      </div>

      {/* ── 2-col desktop layout ── */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[1fr_auto] lg:items-start lg:gap-4">

        {/* ── Left: gains par type + historique ── */}
        <div className="space-y-4">

          {/* Gains par type */}
          <div className="rounded-[20px] border border-line bg-white/90 p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/60">
                Gains par type
              </p>
            </div>
            <PayoutBreakdownTable items={data.payoutBreakdown} />
            {data.payoutBreakdown.length > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-foreground/50">
                  Total estimé
                </span>
                <span className="font-display text-2xl font-black uppercase leading-none text-primary">
                  {formatCurrency(data.progress.estimatedPayout)}
                </span>
              </div>
            )}
          </div>

          {/* Historique des paiements */}
          <div className="rounded-[20px] border border-line bg-white/90 p-5">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/60">
              Historique des paiements
            </p>
            <PaymentHistoryTable history={data.paymentHistory} />
          </div>

        </div>

        {/* ── Right: how it works info card ── */}
        <div className="w-full lg:w-72">
          <div className="rounded-[20px] border border-line bg-white/90 p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/60">
              Comment ça marche
            </p>

            <InfoRow
              step="01"
              label="Upload validé"
              desc="Chaque vidéo approuvée par l'équipe est comptabilisée au tarif de son type."
            />
            <InfoRow
              step="02"
              label="Calcul en fin de mois"
              desc="Le total est calculé à la clôture du mois sur toutes tes vidéos validées."
            />
            <InfoRow
              step="03"
              label="Virement sous 7j"
              desc="Le paiement est déclenché dans les 7 jours suivant la clôture du cycle."
            />

            {!data.hasPayoutProfile && (
              <Link
                href="/settings"
                className="mt-2 flex items-center justify-center gap-2 rounded-[18px] bg-secondary px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-white transition hover:bg-secondary/90 active:scale-95"
              >
                Configurer le paiement →
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function StatTile({
  label,
  value,
  color
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 px-2 py-2 text-center">
      <p className={`font-display text-xl font-black leading-none ${color}`}>{value}</p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-white/50">
        {label}
      </p>
    </div>
  );
}

function InfoRow({
  step,
  label,
  desc
}: {
  step: string;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[2px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-[10px] font-black text-primary">
        {step}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-foreground/80">{label}</p>
        <p className="mt-0.5 text-[11px] leading-[1.45] text-foreground/55">{desc}</p>
      </div>
    </div>
  );
}
