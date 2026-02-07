"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/currency";
import { toShortDate } from "@/lib/date";
import { paymentStatusTone } from "@/lib/status-tone";

interface MonthlyTrackingTableProps {
  rows: Array<{
    monthlyTrackingId: string;
    creatorId: string;
    handle: string;
    packageTier: number;
    mixLabel: string;
    quotas: Record<string, number>;
    delivered: Record<string, number>;
    deliveredTotal: number;
    remainingTotal: number;
    deadline: string;
    paymentStatus: string;
    paymentStatusKey: "a_faire" | "en_cours" | "paye";
    payoutAmount: number;
  }>;
}

export function MonthlyTrackingTable({ rows }: MonthlyTrackingTableProps) {
  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      {
        id: "creator",
        header: "Createur",
        accessorFn: (row) => row.handle,
        cell: ({ row }) => (
          <Link
            href={`/admin/creators/${row.original.creatorId}`}
            className="font-semibold underline underline-offset-4 hover:text-secondary"
          >
            {row.original.handle}
          </Link>
        )
      },
      {
        id: "pack",
        header: "Pkg",
        accessorFn: (row) => row.packageTier,
        cell: ({ row }) => <span>Pack {row.original.packageTier}</span>
      },
      { accessorKey: "mixLabel", header: "Mix" },
      {
        id: "delivered",
        header: "Livre",
        accessorFn: (row) => row.deliveredTotal,
        cell: ({ row }) => <span className="font-medium">{row.original.deliveredTotal}</span>
      },
      {
        id: "remaining",
        header: "Reste",
        accessorFn: (row) => row.remainingTotal,
        cell: ({ row }) => (
          <span className={row.original.remainingTotal > 0 ? "text-primary font-semibold" : "text-mint font-semibold"}>
            {row.original.remainingTotal}
          </span>
        )
      },
      {
        id: "deadline",
        header: "Deadline",
        accessorFn: (row) => row.deadline,
        cell: ({ row }) => <span>{toShortDate(row.original.deadline)}</span>
      },
      {
        id: "payment",
        header: "Paiement",
        accessorFn: (row) => row.paymentStatus,
        cell: ({ row }) => (
          <StatusBadge label={row.original.paymentStatus} tone={paymentStatusTone(row.original.paymentStatus)} />
        )
      },
      {
        id: "amount",
        header: "Montant",
        accessorFn: (row) => row.payoutAmount,
        cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.payoutAmount)}</span>
      }
    ],
    []
  );

  return (
    <DataTableCard title="Suivi mensuel detaille" subtitle="Vue synthese par createur pour le mois actif.">
      <div className="p-5">
        <DataTable
          data={rows}
          columns={columns}
          pageSize={10}
          emptyMessage="Aucun tracking."
          getRowId={(row) => row.monthlyTrackingId}
          renderMobileRow={(row) => (
            <div className="rounded-2xl border border-line bg-white/95 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/creators/${row.creatorId}`}
                  className="font-semibold underline underline-offset-4 hover:text-secondary"
                >
                  {row.handle}
                </Link>
                <StatusBadge label={row.paymentStatus} tone={paymentStatusTone(row.paymentStatus)} />
              </div>
              <div className="text-xs text-foreground/60">
                Pack {row.packageTier} • {row.mixLabel}
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Livre</span>
                <span className="font-medium">{row.deliveredTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Reste</span>
                <span className={row.remainingTotal > 0 ? "text-primary font-semibold" : "text-mint font-semibold"}>
                  {row.remainingTotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Montant</span>
                <span className="font-semibold">{formatCurrency(row.payoutAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-foreground/60">
                <span>Deadline</span>
                <span>{toShortDate(row.deadline)}</span>
              </div>
            </div>
          )}
        />
      </div>
    </DataTableCard>
  );
}

