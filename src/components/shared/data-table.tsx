"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import type { Paginated } from "@/lib/types/pagination";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: Paginated<T> | T[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  isError,
  onRetry,
  onRowClick,
  page,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<T>) {
  const normalizedData: Paginated<T> | undefined = Array.isArray(data)
    ? {
        items: data,
        page: page ?? 1,
        pageSize: data.length || 1,
        total: data.length,
        totalPages: 1,
      }
    : data;

  const table = useReactTable({
    data: normalizedData?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const newSelection = typeof updater === "function" ? updater(rowSelection ?? {}) : updater;
      onRowSelectionChange?.(newSelection);
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {onSearchChange && (
        <Input
          value={search ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
      )}

      {isLoading ? (
        <TableSkeleton columns={columns.length} />
      ) : isError ? (
        <ErrorState onRetry={onRetry} />
      ) : !normalizedData || normalizedData.items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {table.getRowModel().rows.map((row) => {
              const cells = row.getVisibleCells();
              const selectCell = cells.find((cell) => cell.column.id === "select");
              const [primaryCell, ...restCells] = cells.filter((cell) => cell.column.id !== "select");
              return (
                <div
                  key={row.id}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={() => onRowClick?.(row.original)}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(row.original);
                    }
                  }}
                  className={cn(
                    "skeuo-plate rounded-[12px] border p-4 transition-all focus-visible:outline-2 focus-visible:outline-[#8a6420]",
                    onRowClick && "cursor-pointer touch-manipulation active:translate-y-[1px]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {primaryCell && flexRender(primaryCell.column.columnDef.cell, primaryCell.getContext())}
                    </div>
                    {selectCell && (
                      <div onClick={(event) => event.stopPropagation()} className="shrink-0">
                        {flexRender(selectCell.column.columnDef.cell, selectCell.getContext())}
                      </div>
                    )}
                  </div>
                  {restCells.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-stone-100 pt-3 dark:border-white/10">
                      {restCells.map((cell) => {
                        const header = cell.column.columnDef.header;
                        const label = typeof header === "string" ? header : null;
                        return (
                          <div key={cell.id} className="min-w-0">
                            {label && (
                              <div className="mb-0.5 text-[9px] font-black uppercase tracking-[.14em] text-stone-600 dark:text-stone-300">
                                {label}
                              </div>
                            )}
                            <div className="truncate text-sm">{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="skeuo-plate hidden overflow-hidden rounded-[14px] border sm:block">
            <div aria-hidden="true" className="h-2 border-b border-[#4a3f2a] bg-[repeating-linear-gradient(90deg,#6b5d42_0_6px,#3a3222_6px_12px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" />
            <div className="skeuo-ledger overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <Table className="min-w-[640px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-black hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-[11px] font-black uppercase tracking-[0.14em]">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      "transition-colors focus-visible:outline-2 focus-visible:outline-[#8a6420]",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="font-bold">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>

          {page !== undefined && onPageChange ? (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
            <span className="skeuo-embossed-label rounded-[8px] px-3 py-1.5 font-mono text-xs tabular-nums">
              Page {normalizedData.page} of {normalizedData.totalPages} &middot; {normalizedData.total} total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label="Previous page"
                className="min-h-10 min-w-10 rounded-[10px]"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= normalizedData.totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label="Next page"
                className="min-h-10 min-w-10 rounded-[10px]"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          ) : null}
        </>
      )}
    </div>
  );
}
