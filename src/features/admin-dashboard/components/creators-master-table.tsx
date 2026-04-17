"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { CreatorKitStatus } from "@/domain/types";
import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/cn";
import { creatorStatusTone } from "@/lib/status-tone";

import { KitStatusCell } from "./kit-status-cell";

interface CreatorsMasterTableRow {
  creatorId: string;
  handle: string;
  email: string;
  country: string;
  status: string;
  kitStatus: CreatorKitStatus;
}

interface CreatorsMasterTableProps {
  rows: CreatorsMasterTableRow[];
}

type KitFilter = "all" | "pending";

/**
 * Rows whose kit is "not yet ordered" — admin surface for chasing creators
 * who got a code but haven't redeemed it. Excludes `not_applicable` (no
 * contract signed) and `ordered` (done).
 */
const PENDING_KIT_STATUSES: ReadonlySet<CreatorKitStatus> = new Set([
  "pending_code",
  "code_ready",
  "failed"
]);

export function CreatorsMasterTable({ rows }: CreatorsMasterTableProps) {
  const [kitFilter, setKitFilter] = useState<KitFilter>("all");

  const filteredRows = useMemo(() => {
    if (kitFilter === "pending") {
      return rows.filter((row) => PENDING_KIT_STATUSES.has(row.kitStatus));
    }
    return rows;
  }, [rows, kitFilter]);

  const pendingCount = useMemo(
    () => rows.filter((row) => PENDING_KIT_STATUSES.has(row.kitStatus)).length,
    [rows]
  );

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
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
        <FilterPill
          label="Tous"
          active={kitFilter === "all"}
          onClick={() => setKitFilter("all")}
        />
        <FilterPill
          label={`Kit non commandé${pendingCount > 0 ? ` · ${pendingCount}` : ""}`}
          active={kitFilter === "pending"}
          onClick={() => setKitFilter("pending")}
        />
      </div>

      <div className="p-5">
        <DataTable
          data={filteredRows}
          columns={columns}
          pageSize={10}
          emptyMessage={
            kitFilter === "pending" ? "Aucun créateur en attente de kit." : "Aucun créateur."
          }
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

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, active, onClick }: FilterPillProps) {
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
