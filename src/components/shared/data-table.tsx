"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
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
  isError: boolean;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  page: number;
  onPageChange: (page: number) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
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
}: DataTableProps<T>) {
  const normalizedData: Paginated<T> | undefined = Array.isArray(data)
    ? {
        items: data,
        page,
        pageSize: data.length || 1,
        total: data.length,
        totalPages: 1,
      }
    : data;

  const table = useReactTable({
    data: normalizedData?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
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
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
                      "transition-colors",
                      onRowClick && "cursor-pointer",
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {normalizedData.page} of {normalizedData.totalPages} &middot; {normalizedData.total} total
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= normalizedData.totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
