"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ThumbsDown, ThumbsUp } from "lucide-react";
import type { ColumnDef, RowSelectionState, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/layout/card-section";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/context/auth-context";
import { cn } from "@/lib/cn";

interface ValidationQueueProps {
  rows: Array<{
    videoId: string;
    creatorHandle: string;
    videoType: string;
    fileUrl: string;
    uploadedAt: string;
    durationSeconds: number;
    resolution: string;
  }>;
}

export function ValidationQueue({ rows }: ValidationQueueProps) {
  const auth = useAuth();
  const router = useRouter();
  const canAct = Boolean(auth.user);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creatorFilter, setCreatorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "7D" | "30D">("ALL");
  const [sorting, setSorting] = useState<SortingState>([{ id: "uploadedAt", desc: true }]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const videoTypes = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.videoType))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const creatorNeedle = creatorFilter.trim().toLowerCase();
    const now = Date.now();
    const minTimestamp =
      dateFilter === "7D"
        ? now - 7 * 24 * 60 * 60 * 1000
        : dateFilter === "30D"
          ? now - 30 * 24 * 60 * 60 * 1000
          : null;
    return rows.filter((row) => {
      if (typeFilter !== "ALL" && row.videoType !== typeFilter) return false;
      if (minTimestamp) {
        const ts = Date.parse(row.uploadedAt);
        if (Number.isFinite(ts) && ts < minTimestamp) return false;
      }
      if (!creatorNeedle) return true;
      return row.creatorHandle.toLowerCase().includes(creatorNeedle);
    });
  }, [rows, creatorFilter, typeFilter, dateFilter]);

  const openPreview = useCallback(async (fileUrl: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/videos/preview?fileUrl=${encodeURIComponent(fileUrl)}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { signedUrl?: string; message?: string } | null;
      if (!response.ok || !data?.signedUrl) {
        throw new Error(data?.message ?? "Impossible de generer un lien de preview.");
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de generer un lien de preview.");
    }
  }, []);

  const reviewMany = useCallback(async (
    videoIds: string[],
    decision: "approved" | "rejected",
    reason?: string | null
  ) => {
    if (!canAct) {
      router.replace("/login");
      return;
    }

    setError(null);

    try {
      for (const videoId of videoIds) {
        const response = await fetch("/api/admin/videos/review", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            videoId,
            decision,
            rejectionReason: decision === "rejected" ? reason ?? null : null
          }),
          cache: "no-store"
        });

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(data?.message ?? "Impossible de mettre a jour la video.");
        }
      }

      setRejectingId(null);
      setRejectionReason("");
      setBulkRejecting(false);
      setBulkRejectionReason("");
      setRowSelection({});
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de mettre a jour la video.");
    }
  }, [canAct, router]);

  const reviewOne = useCallback(
    async (videoId: string, decision: "approved" | "rejected", reason?: string | null) => {
      await reviewMany([videoId], decision, reason);
    },
    [reviewMany]
  );

  const columns = useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 accent-secondary"
            checked={table.getIsAllPageRowsSelected()}
            aria-label="Select all"
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 accent-secondary"
            checked={row.getIsSelected()}
            aria-label="Select row"
            onChange={(event) => row.toggleSelected(event.target.checked)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
        enableSorting: false
      },
      {
        id: "creator",
        header: "Createur",
        accessorFn: (row) => row.creatorHandle,
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <p className="truncate text-sm font-semibold">{row.original.creatorHandle}</p>
            <p className="text-xs text-foreground/60">{row.original.videoType}</p>
          </div>
        )
      },
      {
        id: "uploadedAt",
        header: "Upload",
        accessorFn: (row) => row.uploadedAt,
        cell: ({ row }) => (
          <div className="text-xs text-foreground/65">
            {row.original.durationSeconds}s • {row.original.resolution}
            <div>{new Date(row.original.uploadedAt).toLocaleString("fr-FR")}</div>
          </div>
        )
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => {
          const isRejecting = rejectingId === row.original.videoId;
          return (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  void openPreview(row.original.fileUrl);
                }}
                disabled={!canAct}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  void reviewOne(row.original.videoId, "approved");
                }}
                disabled={!canAct}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Valider
              </Button>
              <Button
                type="button"
                size="sm"
                variant={isRejecting ? "default" : "outline"}
                onClick={(event) => {
                  event.stopPropagation();
                  setError(null);
                  setRejectingId((current) => (current === row.original.videoId ? null : row.original.videoId));
                  setRejectionReason("");
                }}
                disabled={!canAct}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Rejeter
              </Button>
            </div>
          );
        }
      }
    ],
    [canAct, openPreview, rejectingId, reviewOne]
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: { sorting, pagination, rowSelection },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.videoId
  });

  const selectedIds = table.getSelectedRowModel().rows.map((row) => row.original.videoId);

  return (
    <CardSection className="space-y-3">
      <p className="mb-3 text-xs uppercase tracking-[0.15em] text-foreground/50">File de validation</p>

      {error ? (
        <div
          className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-line bg-frost/70 px-4 py-6 text-sm text-foreground/70">
          Rien a valider pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={creatorFilter}
              onChange={(event) => setCreatorFilter(event.target.value)}
              placeholder="Filtrer par createur..."
              className="h-10 w-full sm:w-[240px]"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="h-10 rounded-xl border border-line bg-white px-3 text-sm"
            >
              <option value="ALL">Tous les types</option>
              {videoTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as "ALL" | "7D" | "30D")}
              className="h-10 rounded-xl border border-line bg-white px-3 text-sm"
            >
              <option value="ALL">Toutes les dates</option>
              <option value="7D">Derniers 7 jours</option>
              <option value="30D">Derniers 30 jours</option>
            </select>

            {selectedIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-frost/70 px-3 py-2 text-sm">
                <span className="font-medium">{selectedIds.length} selectionnes</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void reviewMany(selectedIds, "approved")}
                  disabled={!canAct}
                >
                  Valider
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkRejecting(true)}
                  disabled={!canAct}
                >
                  Rejeter
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setRowSelection({})}>
                  Effacer
                </Button>
              </div>
            ) : null}
          </div>

          {bulkRejecting && selectedIds.length > 0 ? (
            <div className="rounded-2xl border border-line bg-frost/70 p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Raison (pour tout le lot)</p>
              <Textarea
                value={bulkRejectionReason}
                onChange={(event) => setBulkRejectionReason(event.target.value)}
                placeholder="Ex: Hook trop tard, format horizontal, sous-titres illisibles..."
                className="mt-2"
                rows={3}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void reviewMany(selectedIds, "rejected", bulkRejectionReason)}
                  disabled={!canAct || bulkRejectionReason.trim().length === 0}
                >
                  Confirmer le rejet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkRejecting(false);
                    setBulkRejectionReason("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => {
                      const canSort = header.column.getCanSort();
                      const direction = header.column.getIsSorted();
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(canSort ? "cursor-pointer select-none" : undefined)}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                        >
                          <span className="inline-flex items-center gap-1">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            {direction === "asc" ? "↑" : direction === "desc" ? "↓" : null}
                          </span>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-foreground/60">
                      Aucun contenu dans cette vue.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const isRejecting = rejectingId === row.original.videoId;
                    return (
                      <Fragment key={row.id}>
                        <TableRow>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                        {isRejecting ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={columns.length}>
                              <div className="rounded-2xl border border-line bg-frost/70 p-4">
                                <p className="text-xs uppercase tracking-[0.12em] text-foreground/55">Raison du rejet</p>
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(event) => setRejectionReason(event.target.value)}
                                  placeholder="Ex: Hook trop tard, format horizontal, sous-titres illisibles..."
                                  className="mt-2"
                                  rows={3}
                                />
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => void reviewOne(row.original.videoId, "rejected", rejectionReason)}
                                    disabled={!canAct || rejectionReason.trim().length === 0}
                                  >
                                    Confirmer le rejet
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setRejectingId(null);
                                      setRejectionReason("");
                                    }}
                                  >
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {table.getPageCount() > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 px-2">
              <p className="text-xs text-foreground/60">
                Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                >
                  Precedent
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                >
                  Suivant
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </CardSection>
  );
}
