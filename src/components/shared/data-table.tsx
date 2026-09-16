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
          className="max-w-sm rounded-[19px] border-white/90 bg-white/85 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-white/5"
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
                    "rounded-[19px] border border-white/90 bg-white/88 p-4 shadow-[0_16px_45px_-30px_rgba(79,70,229,.4)] backdrop-blur-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:border-white/10 dark:bg-card/90",
                    onRowClick && "cursor-pointer touch-manipulation active:bg-violet-50/60 dark:active:bg-white/5",
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

          <div className="hidden overflow-hidden rounded-[22px] border border-white/90 bg-white/88 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl sm:block dark:border-white/10 dark:bg-card/90">
            <div aria-hidden="true" className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-400" />
            <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]">
            <Table className="min-w-[640px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-gradient-to-r from-stone-50 via-violet-50/50 to-cyan-50/50 hover:bg-stone-50 dark:from-white/5 dark:via-white/5 dark:to-transparent dark:hover:bg-white/5">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-[11px] font-black uppercase tracking-[.14em] text-stone-600 dark:text-stone-300">
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
                      "transition-colors hover:bg-violet-50/50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-violet-600 dark:hover:bg-white/5",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="font-medium text-stone-900 dark:text-stone-100">
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
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-stone-600 dark:text-stone-300">
            <span className="rounded-full border border-white/80 bg-white/70 px-3 py-1.5 font-mono text-xs font-bold tabular-nums shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              Page {normalizedData.page} of {normalizedData.totalPages} &middot; {normalizedData.total} total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label="Previous page"
                className="min-h-11 min-w-11 rounded-[15px] border-white/80 bg-white/85 shadow-sm backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-white/5"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= normalizedData.totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label="Next page"
                className="min-h-11 min-w-11 rounded-[15px] border-white/80 bg-white/85 shadow-sm backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 dark:bg-white/5"
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
