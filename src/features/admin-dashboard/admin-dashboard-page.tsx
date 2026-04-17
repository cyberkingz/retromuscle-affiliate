"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, LayoutDashboard } from "lucide-react";

import type { AdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { AdminMetricsStrip } from "@/features/admin-dashboard/components/admin-metrics-strip";
import { CreatorsMasterTable } from "@/features/admin-dashboard/components/creators-master-table";
import { KitOrdersTable } from "@/features/admin-dashboard/components/kit-orders-table";
import { MonthlyTrackingTable } from "@/features/admin-dashboard/components/monthly-tracking-table";
import { PaymentsTable } from "@/features/admin-dashboard/components/payments-table";
import { ValidationQueue } from "@/features/admin-dashboard/components/validation-queue";
import { monthToLabel } from "@/lib/date";

interface AdminDashboardPageProps {
  data: AdminDashboardData;
}

export function AdminDashboardPage({ data }: AdminDashboardPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-5">

      {/* ── Admin header bar ── */}
      <div className="relative overflow-hidden rounded-[22px] bg-secondary px-6 py-5 text-white">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary opacity-10 blur-3xl" />
        {/* Watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-4 right-5 select-none font-display text-[100px] font-black leading-none text-white/[0.04]"
        >
          RM
        </span>

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <LayoutDashboard className="h-5 w-5 text-white/70" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">
                Admin
              </p>
              <h1 className="font-display text-2xl font-black uppercase leading-none tracking-wide text-white">
                Opérations
              </h1>
            </div>
          </div>

          {data.availableMonths.length > 1 ? (
            <select
              value={data.month}
              onChange={(event) => router.push(`/admin?month=${event.target.value}`)}
              className="h-9 rounded-full border border-white/20 bg-white/10 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur-sm transition hover:bg-white/15"
              aria-label="Sélectionner le mois"
            >
              {data.availableMonths.map((m) => (
                <option key={m} value={m} className="bg-secondary capitalize text-white">
                  {monthToLabel(m)}
                </option>
              ))}
            </select>
          ) : (
            <span className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
              {monthToLabel(data.month)}
            </span>
          )}
        </div>
      </div>

      {/* ── Metrics ── */}
      <AdminMetricsStrip {...data.metrics} />

      {/* ── Validation Queue — full width ── */}
      <ValidationQueue rows={data.validationQueue} />

      {/* ── Payments — full width ── */}
      <PaymentsTable month={data.month} rows={data.payments} />

      {/* ── Kit Orders — full width ── */}
      <KitOrdersTable rows={data.kitOrders} shopDomain="retromuscle1000.myshopify.com" />

      {/* ── Collapsible sections ── */}
      <AdminAccordion title={`Créateurs (${data.creatorsMaster.length})`}>
        <CreatorsMasterTable rows={data.creatorsMaster} />
      </AdminAccordion>

      <AdminAccordion title={`Tracking mensuel (${data.monthlyRows.length})`}>
        <MonthlyTrackingTable rows={data.monthlyRows} />
      </AdminAccordion>

    </div>
  );
}

/* ── Sub-component: branded accordion ─────────────────────────────────────── */

function AdminAccordion({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group overflow-hidden rounded-[20px] border border-line bg-white/90">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 transition-colors hover:bg-frost/40">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/60 group-open:text-secondary">
          {title}
        </p>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="border-t border-line">
        {children}
      </div>
    </details>
  );
}
