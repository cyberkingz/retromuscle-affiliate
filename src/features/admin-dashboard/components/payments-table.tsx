"use client";

import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { DataTableCard } from "@/components/ui/data-table-card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/currency";
import { paymentStatusTone } from "@/lib/status-tone";
import { useAuth } from "@/features/auth/context/auth-context";

interface PaymentsTableProps {
  month: string;
  rows: Array<{
    monthlyTrackingId: string;
    creatorId: string;
    email: string;
    creatorHandle: string;
    deliveredSummary: string;
    amount: number;
    paymentStatus: string;
    paymentStatusKey: "a_faire" | "en_cours" | "paye";
    hasPayoutProfile: boolean;
  }>;
}

export function PaymentsTable({ month, rows }: PaymentsTableProps) {
  const auth = useAuth();
  const router = useRouter();

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const markPaid = useCallback(
    async (monthlyTrackingId: string) => {
      if (!auth.user) {
        router.replace("/login");
        return;
      }

      setSubmittingId(monthlyTrackingId);
      setConfirmingId(null);
      setError(null);

      try {
        const response = await fetch("/api/admin/payments/mark-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyTrackingId })
        });

        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.message ?? "Impossible de mettre a jour le statut.");
        }

        router.refresh();
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Impossible de mettre a jour le statut."
        );
      } finally {
        setSubmittingId(null);
      }
    },
    [auth.user, router]
  );

  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      {
        id: "creator",
        header: "Créateur",
        accessorFn: (row) => row.creatorHandle,
        cell: ({ row }) => (
          <div className="min-w-[170px]">
            <p className="font-semibold">
              <Link
                href={`/admin/creators/${row.original.creatorId}`}
                className="underline underline-offset-4 hover:text-secondary"
              >
                {row.original.creatorHandle}
              </Link>
            </p>
            <p className="text-xs text-foreground/60">{row.original.email}</p>
          </div>
        )
      },
      {
        accessorKey: "deliveredSummary",
        header: "Livrées"
      },
      {
        id: "amount",
        header: "Montant",
        accessorFn: (row) => row.amount,
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">{formatCurrency(row.original.amount)}</span>
        )
      },
      {
        id: "status",
        header: "Statut",
        accessorFn: (row) => row.paymentStatus,
        cell: ({ row }) => (
          <StatusBadge
            label={row.original.paymentStatus}
            tone={paymentStatusTone(row.original.paymentStatus)}
          />
        )
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const isPaid = row.original.paymentStatusKey === "paye";
          const busy = submittingId === row.original.monthlyTrackingId;
          const isConfirming = confirmingId === row.original.monthlyTrackingId;
          const noProfile = !row.original.hasPayoutProfile;
          return (
            <div className="flex flex-col items-end gap-2">
              {isPaid ? (
                <span className="inline-flex items-center gap-2 text-xs font-medium text-mint">
                  <CheckCircle2 className="h-4 w-4" />
                  Payé
                </span>
              ) : noProfile ? (
                <Link
                  href={`/admin/creators/${row.original.creatorId}`}
                  className="text-xs font-medium text-destructive underline underline-offset-2 whitespace-nowrap hover:text-destructive/80"
                >
                  Profil paiement manquant
                </Link>
              ) : isConfirming ? (
                <div className="flex flex-col gap-2 rounded-xl border border-line bg-frost/70 px-3 py-2 text-sm">
                  <span className="text-xs text-foreground/70 whitespace-nowrap">
                    Action irreversible. Confirmer ?
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => void markPaid(row.original.monthlyTrackingId)}
                      disabled={!auth.user || busy}
                    >
                      {busy ? "..." : "Confirmer"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="whitespace-nowrap"
                      onClick={() => setConfirmingId(null)}
                      disabled={busy}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => {
                    setError(null);
                    setConfirmingId(row.original.monthlyTrackingId);
                  }}
                  disabled={!auth.user || busy}
                >
                  Marquer payé
                </Button>
              )}
            </div>
          );
        }
      }
    ],
    [auth.user, submittingId, confirmingId, markPaid]
  );

  const action = (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() =>
        window.open(`/api/admin/payments/export?month=${encodeURIComponent(month)}`, "_blank")
      }
      disabled={!auth.user}
    >
      <Download className="mr-2 h-4 w-4" />
      Export CSV
    </Button>
  );

  return (
    <DataTableCard
      title="Gestion paiements"
      subtitle="Montants et statuts du mois en cours."
      action={action}
    >
      <div className="px-5 pb-4">
        {error ? (
          <p
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        pageSize={8}
        emptyMessage="Aucun paiement pour ce mois."
        aria-label="Tableau des paiements"
        getRowId={(row) => row.monthlyTrackingId}
        renderMobileRow={(row) => (
          <div className="rounded-2xl border border-line bg-white/95 p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-sm">{row.creatorHandle}</p>
                <p className="truncate text-xs text-foreground/75">{row.email}</p>
              </div>
              <StatusBadge label={row.paymentStatus} tone={paymentStatusTone(row.paymentStatus)} />
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-foreground/65">
              <span>{row.deliveredSummary}</span>
              <span className="font-semibold tabular-nums text-sm text-foreground">
                {formatCurrency(row.amount)}
              </span>
            </div>
            {row.paymentStatusKey !== "paye" ? (
              !row.hasPayoutProfile ? (
                <Link
                  href={`/admin/creators/${row.creatorId}`}
                  className="inline-block text-xs font-medium text-destructive underline underline-offset-2"
                >
                  Profil paiement manquant
                </Link>
              ) : confirmingId === row.monthlyTrackingId ? (
                <div className="space-y-2 rounded-xl border border-line bg-frost/70 px-3 py-2">
                  <p className="text-xs text-foreground/70">
                    Confirmer le paiement de {formatCurrency(row.amount)}&nbsp;?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="flex-1"
                      onClick={() => void markPaid(row.monthlyTrackingId)}
                      disabled={!auth.user || submittingId === row.monthlyTrackingId}
                    >
                      {submittingId === row.monthlyTrackingId ? "..." : "Confirmer"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setConfirmingId(null)}
                      disabled={submittingId === row.monthlyTrackingId}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setError(null);
                    setConfirmingId(row.monthlyTrackingId);
                  }}
                  disabled={!auth.user || submittingId === row.monthlyTrackingId}
                >
                  Marquer payé
                </Button>
              )
            ) : null}
          </div>
        )}
      />
    </DataTableCard>
  );
}
