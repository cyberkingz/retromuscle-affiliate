"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { CreatorKitStatus } from "@/domain/types";
import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { toShortDate } from "@/lib/date";
import { creatorStatusTone } from "@/lib/status-tone";

import { KitStatusCell } from "./kit-status-cell";

type TableFilter = "all" | "no_contract" | "kit_pending";

const PENDING_KIT_STATUSES: ReadonlySet<CreatorKitStatus> = new Set([
  "pending_code",
  "code_ready",
  "failed"
]);

interface CreatorsMasterTableRow {
  creatorId: string;
  handle: string;
  email: string;
  country: string;
  status: string;
  contractSignedAt?: string;
  kitStatus: CreatorKitStatus;
}

interface CreatorsMasterTableProps {
  rows: Array<CreatorsMasterTableRow>;
}

export function CreatorsMasterTable({ rows }: CreatorsMasterTableProps) {
  const [filter, setFilter] = useState<TableFilter>("all");

  const filteredRows = useMemo(() => {
    if (filter === "no_contract") return rows.filter((row) => !row.contractSignedAt);
    if (filter === "kit_pending") return rows.filter((row) => PENDING_KIT_STATUSES.has(row.kitStatus));
    return rows;
  }, [rows, filter]);

  const noContractCount = useMemo(() => rows.filter((r) => !r.contractSignedAt).length, [rows]);
  const kitPendingCount = useMemo(() => rows.filter((r) => PENDING_KIT_STATUSES.has(r.kitStatus)).length, [rows]);

  const columns = useMemo<ColumnDef<CreatorsMasterTableRow>[]>(
    () => [
      {
        id: "handle",
        header: "Nom",
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
      { accessorKey: "email", header: "Email" },
      { accessorKey: "country", header: "Pays" },
      {
        id: "contrat",
        header: "Contrat",
        accessorFn: (row) => row.contractSignedAt ?? "",
        cell: ({ row }) =>
          row.original.contractSignedAt ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              ✓ {toShortDate(row.original.contractSignedAt)}
            </span>
          ) : (
            <span className="text-sm text-foreground/35">—</span>
          )
      },
      {
        id: "status",
        header: "Statut",
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <StatusBadge label={row.original.status} tone={creatorStatusTone(row.original.status)} />
        )
      },
      {
        id: "kitStatus",
        header: "Kit",
        accessorFn: (row) => row.kitStatus,
        cell: ({ row }) => <KitStatusCell status={row.original.kitStatus} />
      }
    ],
    []
  );

  return (
    <DataTableCard
      title="Répertoire créateurs"
      subtitle="Base créateurs et statut de collaboration."
    >
      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
        <FilterPill label={`Tous · ${rows.length}`} active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterPill
          label={`Sans contrat${noContractCount > 0 ? ` · ${noContractCount}` : ""}`}
          active={filter === "no_contract"}
          onClick={() => setFilter("no_contract")}
        />
        <FilterPill
          label={`Kit non commandé${kitPendingCount > 0 ? ` · ${kitPendingCount}` : ""}`}
          active={filter === "kit_pending"}
          onClick={() => setFilter("kit_pending")}
        />
      </div>
      <div className="p-5">
        <DataTable
          data={filteredRows}
          columns={columns}
          pageSize={10}
          emptyMessage="Aucun créateur."
          aria-label="Répertoire des créateurs"
          getRowId={(row) => row.creatorId}
          renderMobileRow={(row) => (
            <div className="rounded-2xl border border-line bg-white/95 p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/admin/creators/${row.creatorId}`}
                  className="font-semibold underline underline-offset-4 hover:text-secondary"
                >
                  {row.handle}
                </Link>
                <StatusBadge label={row.status} tone={creatorStatusTone(row.status)} />
              </div>
              <div className="text-xs text-foreground/60">{row.email}</div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Pays</span>
                <span className="font-medium">{row.country}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Contrat</span>
                {row.contractSignedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                    ✓ {toShortDate(row.contractSignedAt)}
                  </span>
                ) : (
                  <span className="text-foreground/35">—</span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Kit</span>
                <KitStatusCell status={row.kitStatus} />
              </div>
            </div>
          )}
        />
      </div>
    </DataTableCard>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] transition",
        active
          ? "border-secondary bg-secondary text-white"
          : "border-line bg-white/80 text-foreground/60 hover:border-secondary/40 hover:text-secondary"
      )}
    >
      {label}
    </button>
  );
}
