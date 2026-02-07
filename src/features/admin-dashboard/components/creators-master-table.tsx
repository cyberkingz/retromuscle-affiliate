"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { DataTable } from "@/components/ui/data-table";
import { DataTableCard } from "@/components/ui/data-table-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { creatorStatusTone } from "@/lib/status-tone";

interface CreatorsMasterTableProps {
  rows: Array<{
    creatorId: string;
    handle: string;
    email: string;
    country: string;
    packageTier: number;
    mixLabel: string;
    status: string;
  }>;
}

export function CreatorsMasterTable({ rows }: CreatorsMasterTableProps) {
  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
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
        id: "pack",
        header: "Package",
        accessorFn: (row) => row.packageTier,
        cell: ({ row }) => <span>Pack {row.original.packageTier}</span>
      },
      { accessorKey: "mixLabel", header: "Mix" },
      {
        id: "status",
        header: "Statut",
        accessorFn: (row) => row.status,
        cell: ({ row }) => (
          <StatusBadge label={row.original.status} tone={creatorStatusTone(row.original.status)} />
        )
      }
    ],
    []
  );

  return (
    <DataTableCard title="Creators master" subtitle="Base createurs et statut de collaboration.">
      <div className="p-5">
        <DataTable
          data={rows}
          columns={columns}
          pageSize={10}
          emptyMessage="Aucun createur."
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
                <span>Pack</span>
                <span className="font-medium">{row.packageTier}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/75">
                <span>Mix</span>
                <span className="font-medium">{row.mixLabel}</span>
              </div>
            </div>
          )}
        />
      </div>
    </DataTableCard>
  );
}

