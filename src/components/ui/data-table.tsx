"use client";

import * as React from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageSize?: number;
  emptyMessage?: string;
  getRowId?: (row: TData, index: number) => string;
  onRowClick?: (row: TData) => void;
  isRowSelected?: (row: TData) => boolean;
  renderMobileRow?: (row: TData) => React.ReactNode;
  "aria-label"?: string;
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  if (!direction) return null;
  return direction === "asc" ? (
    <ChevronUp className="h-4 w-4" />
  ) : (
    <ChevronDown className="h-4 w-4" />
  );
}

export function DataTable<TData>({
  data,
  columns,
  pageSize = 10,
  emptyMessage = "Aucun resultat.",
  getRowId,
  onRowClick,
  isRowSelected,
  renderMobileRow,
  "aria-label": ariaLabel
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      {renderMobileRow ? (
        <div className="space-y-3 px-4 pb-4 sm:hidden">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-foreground/60">{emptyMessage}</p>
          ) : null}
          {rows.map((row) => (
            <div key={row.id}>{renderMobileRow(row.original)}</div>
          ))}
        </div>
      ) : null}

      <div className={cn("overflow-x-auto", renderMobileRow ? "hidden sm:block" : undefined)}>
        <Table aria-label={ariaLabel}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const direction = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      onKeyDown={
                        canSort
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }
                          : undefined
                      }
                      tabIndex={canSort ? 0 : undefined}
                      role={canSort ? "button" : undefined}
                      aria-sort={
                        canSort
                          ? direction === "asc"
                            ? "ascending"
                            : direction === "desc"
                              ? "descending"
                              : "none"
                          : undefined
                      }
                      className={cn(
                        canSort ? "cursor-pointer select-none" : undefined,
                        "whitespace-nowrap"
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort ? <SortIcon direction={direction} /> : null}
                      </span>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="py-10 text-center text-sm text-foreground/60"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <DataTableRow
                  key={row.id}
                  row={row}
                  onRowClick={onRowClick}
                  isSelected={isRowSelected ? isRowSelected(row.original) : false}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {table.getPageCount() > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <p className="text-xs text-foreground/60" aria-live="polite" role="status">
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
  );
}

function DataTableRow<TData>({
  row,
  onRowClick,
  isSelected
}: {
  row: Row<TData>;
  onRowClick?: (row: TData) => void;
  isSelected: boolean;
}) {
  return (
    <TableRow
      className={cn(isSelected ? "bg-frost/70 hover:bg-frost/70" : undefined)}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      onKeyDown={
        onRowClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onRowClick(row.original);
              }
            }
          : undefined
      }
      tabIndex={onRowClick ? 0 : undefined}
      role={onRowClick ? "link" : undefined}
      style={onRowClick ? { cursor: "pointer" } : undefined}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}
