"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";

import type { AdminDashboardData } from "@/application/use-cases/get-admin-dashboard-data";
import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { toShortDate } from "@/lib/date";

type Row = AdminDashboardData["kitOrders"][number];

interface KitOrdersTableProps {
  rows: Row[];
  shopDomain?: string;
}

export function KitOrdersTable({ rows, shopDomain }: KitOrdersTableProps) {
  const resolvedShopDomain = shopDomain ?? "retromuscle1000.myshopify.com";

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        id: "creator",
        header: "Créateur",
        accessorFn: (r) => r.handle,
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
        id: "code",
        header: "Code utilisé",
        accessorFn: (r) => r.promoCode,
        cell: ({ row }) => (
          <code className="rounded-md border border-line bg-frost px-2 py-0.5 text-xs font-semibold text-primary tracking-wider">
            {row.original.promoCode}
          </code>
        )
      },
      {
        id: "orderedAt",
        header: "Date commande",
        accessorFn: (r) => r.orderedAt,
        cell: ({ row }) => (
          <span className="text-sm text-foreground/70">{toShortDate(row.original.orderedAt)}</span>
        )
      },
      {
        id: "amount",
        header: "Montant",
        accessorFn: (r) => r.orderAmount,
        cell: ({ row }) => {
          const { orderAmount, orderCurrency } = row.original;
          if (orderAmount == null) return <span className="text-foreground/40">—</span>;
          return (
            <span className="font-semibold text-secondary">
              {orderAmount.toFixed(2)} {orderCurrency ?? "EUR"}
            </span>
          );
        }
      },
      {
        id: "shopify",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const { shopifyOrderId } = row.original;
          if (!shopifyOrderId) return null;
          const numericId = shopifyOrderId.includes("/")
            ? shopifyOrderId.split("/").pop()
            : shopifyOrderId;
          return (
            <a
              href={`https://${resolvedShopDomain}/admin/orders/${numericId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/50 hover:text-secondary transition"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Shopify
            </a>
          );
        }
      }
    ],
    [resolvedShopDomain]
  );

  return (
    <DataTableCard
      title={`Commandes kit (${rows.length})`}
      subtitle="Commandes passées par les créateurs avec leur code promo."
    >
      <div className="p-5">
        <DataTable
          data={rows}
          columns={columns}
          pageSize={10}
          emptyMessage="Aucune commande kit pour l'instant."
          aria-label="Commandes kit créateurs"
          getRowId={(r) => r.creatorId}
          renderMobileRow={(row) => (
            <div className="rounded-2xl border border-line bg-white/95 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/creators/${row.creatorId}`}
                  className="font-semibold underline underline-offset-4 hover:text-secondary"
                >
                  {row.handle}
                </Link>
                <span className="text-xs text-foreground/60">{toShortDate(row.orderedAt)}</span>
              </div>
              <code className="rounded-md border border-line bg-frost px-2 py-0.5 text-xs font-semibold text-primary tracking-wider">
                {row.promoCode}
              </code>
              {row.orderAmount != null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Montant</span>
                  <span className="font-semibold text-secondary">
                    {row.orderAmount.toFixed(2)} {row.orderCurrency ?? "EUR"}
                  </span>
                </div>
              )}
            </div>
          )}
        />
      </div>
    </DataTableCard>
  );
}
