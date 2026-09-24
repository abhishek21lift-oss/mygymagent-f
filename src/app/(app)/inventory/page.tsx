"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { toast } from "sonner";
import { PackagePlus, Boxes, AlertTriangle, ArrowRight, Package } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { InventoryOperationsPanel } from "@/components/inventory/inventory-operations";
import { PageHero } from "@/components/shared/page-hero";
import { MetricStrip } from "@/components/shared/panel";
import { StatCard } from "@/components/shared/stat-card";
import { ScanStockDialog } from "@/components/shared/scan-stock-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import {
 Dialog,
 DialogContent,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/auth-context";
import {
 useProducts,
 useRecordStockMovement,
 useStockMovements,
} from "@/lib/hooks/use-inventory";
import { ApiError } from "@/lib/api/client";
import {
 createStockMovementSchema,
 type CreateStockMovementInput,
} from "@/lib/validation/gym";
import type { Product, StockMovement } from "@/lib/types/gym";

function StockMovementDialog({ product }: { product: Product }) {
 const [open, setOpen] = React.useState(false);
 const recordMovement = useRecordStockMovement();

 const form = useForm<CreateStockMovementInput>({
 resolver: zodResolver(createStockMovementSchema),
 defaultValues: { type: "RESTOCK", quantity: 1, note: "" },
 });

 async function onSubmit(values: CreateStockMovementInput) {
 try {
 await recordMovement.mutateAsync({ productId: product.id, input: values });
 toast.success(`Stock movement recorded for ${product.name}`);
 setOpen(false);
 form.reset({ type: "RESTOCK", quantity: 1, note: "" });
 } catch (error) {
 toast.error(error instanceof ApiError ? error.message : "Failed to record movement");
 }
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Button variant="outline" size="sm" className="min-h-11 rounded-xl border-amber-200/70 bg-amber-50/60 font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 <PackagePlus className="size-3.5" aria-hidden="true" />
 Adjust stock
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>Adjust stock for &quot;{product.name}&quot;</DialogTitle>
 </DialogHeader>
 <p className="text-sm font-medium text-stone-600">
 Currently on hand: <span className="font-bold tabular-nums text-stone-950">{product.quantityOnHand}</span>
 </p>
 <Form {...form}>
 <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <FormField
 control={form.control}
 name="type"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Type</FormLabel>
 <Select value={field.value} onValueChange={field.onChange}>
 <FormControl>
 <SelectTrigger className="w-full">
 <SelectValue />
 </SelectTrigger>
 </FormControl>
 <SelectContent>
 <SelectItem value="RESTOCK">Restock</SelectItem>
 <SelectItem value="SALE">Sale</SelectItem>
 <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
 <SelectItem value="DAMAGED">Damaged</SelectItem>
 </SelectContent>
 </Select>
 <FormMessage />
 </FormItem>
 )}
 />
 <FormField
 control={form.control}
 name="quantity"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Quantity</FormLabel>
 <FormControl>
 <Input type="number" {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 </div>
 <p className="text-xs font-medium text-stone-600">
 For Restock/Sale/Damaged, enter a positive count of units. For
 Adjustment, enter a signed correction (e.g. -3 after a recount).
 </p>
 <FormField
 control={form.control}
 name="note"
 render={({ field }) => (
 <FormItem>
 <FormLabel>Note (optional)</FormLabel>
 <FormControl>
 <Input placeholder="Weekly delivery, recount, ..." {...field} />
 </FormControl>
 <FormMessage />
 </FormItem>
 )}
 />
 <DialogFooter>
 <Button type="submit" className="w-full sm:w-auto" disabled={recordMovement.isPending}>
 {recordMovement.isPending ? "Saving..." : "Record movement"}
 </Button>
 </DialogFooter>
 </form>
 </Form>
 </DialogContent>
 </Dialog>
 );
}

function StockCell({ product }: { product: Product }) {
 const low = product.quantityOnHand <= product.reorderLevel;
 if (low) {
 return (
 <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/15 px-2.5 py-1 font-mono text-xs font-black tabular-nums text-amber-800 ring-1 ring-amber-200/70">
 <AlertTriangle className="size-3.5" aria-hidden="true" />
 {product.quantityOnHand} · reorder
 </span>
 );
 }
 return (
 <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 font-mono text-xs font-bold tabular-nums text-emerald-800 ring-1 ring-emerald-200/60">
 {product.quantityOnHand}
 </span>
 );
}

const movementTypeVariant: Record<
 StockMovement["type"], "success" | "secondary" | "outline" | "destructive"
> = {
 RESTOCK: "success",
 SALE: "secondary",
 ADJUSTMENT: "outline",
 DAMAGED: "destructive",
 OPENING: "success",
 TRANSFER_IN: "success",
 TRANSFER_OUT: "secondary",
 RETURN: "success",
};

const movementColumns: ColumnDef<StockMovement>[] = [
 {
 header: "Product",
 accessorKey: "product",
 cell: ({ row }) => <span className="font-bold text-stone-900 dark:text-stone-100">{row.original.product?.name ?? "—"}</span>,
 },
 {
 header: "Type",
 accessorKey: "type",
 cell: ({ row }) => (
 <Badge variant={movementTypeVariant[row.original.type]}>{row.original.type}</Badge>
 ),
 },
 {
 header: "Quantity",
 accessorKey: "quantity",
 cell: ({ row }) => <span className="font-mono font-bold tabular-nums text-stone-950 dark:text-white">{row.original.quantity > 0 ? `+${row.original.quantity}` : row.original.quantity}</span>,
 },
 {
 header: "Note",
 accessorKey: "note",
 cell: ({ row }) => <span className="font-medium text-stone-600 dark:text-stone-400">{row.original.note ?? "—"}</span>,
 },
 {
 header: "Date",
 accessorKey: "createdAt",
 cell: ({ row }) => <span className="font-medium tabular-nums text-stone-600 dark:text-stone-400">{new Date(row.original.createdAt).toLocaleString()}</span>,
 },
];

export default function InventoryPage() {
 const { hasPermission } = useAuth();
 const [productsPage, setProductsPage] = React.useState(1);
 const productsQuery = useProducts({ page: productsPage, pageSize: 20 });
 const [movementsPage, setMovementsPage] = React.useState(1);
 const movementsQuery = useStockMovements({ page: movementsPage, pageSize: 10, order: "desc" });

 const productColumns: ColumnDef<Product>[] = [
 { header: "SKU", accessorKey: "sku", cell: ({ row }) => <span className="font-mono text-xs font-bold text-stone-700 dark:text-stone-300">{row.original.sku}</span> },
 { header: "Name", accessorKey: "name", cell: ({ row }) => <span className="font-bold text-stone-900 dark:text-stone-100">{row.original.name}</span> },
 {
 header: "Category",
 accessorKey: "category",
 cell: ({ row }) => row.original.category ?? "—",
 },
 {
 header: "Price",
 accessorKey: "unitPrice",
 cell: ({ row }) => <span className="font-bold tabular-nums text-stone-950 dark:text-white">{row.original.unitPrice}</span>,
 },
 {
 header: "On hand",
 accessorKey: "quantityOnHand",
 cell: ({ row }) => <StockCell product={row.original} />,
 },
 {
 id: "actions",
 header: "",
 cell: ({ row }) =>
 hasPermission("inventory.manage") && <StockMovementDialog product={row.original} />,
 },
 ];

 const lowStockCount = (productsQuery.data?.items ?? []).filter(
 (p) => p.quantityOnHand <= p.reorderLevel,
 ).length;

 return (
 <div className="pb-4">
 <div className="flex flex-col gap-5">
 <PageHero
 id="inventory-title"
 icon={Package}
 title="Inventory"
 description="Products, stock and suppliers"
 actions={
 <>
 {hasPermission("inventory.read") && <ScanStockDialog />}
 {hasPermission("inventory.manage") && (
 <Link
 href="/inventory/products/new"
 className="btn-sheen inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground transition duration-300 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
 >
 <PackagePlus className="size-4" aria-hidden="true" />
 New product
 </Link>
 )}
 </>
 }
 />

 <MetricStrip label="Stock" columns={2}>
 {/* This page kept its own metric component to the very end: a coloured
 top bar, a blurred orb, a 56px icon tile that scaled and rotated on
 hover, and a two-tone shadow -- four decorative devices on one
 number, on a screen whose job is to tell you what is running out. */}
 <StatCard title="Products · this page" value={productsQuery.data?.total ?? 0} isLoading={productsQuery.isLoading} />
 <StatCard
 title="Low stock · this page"
 value={lowStockCount}
 isLoading={productsQuery.isLoading}
 tone={lowStockCount > 0 ? "warning" : "primary"}
 hint={lowStockCount > 0 ? "Reorder due" : undefined}
 />
 </MetricStrip>

 <section aria-labelledby="inventory-products" className="overflow-hidden rounded-lg border border-border bg-card">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 sm:px-5">
 <h2 id="inventory-products" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Products</h2>
 </div>
 <div className="p-4 sm:p-5">
 <DataTable
 columns={productColumns}
 data={productsQuery.data}
 isLoading={productsQuery.isLoading}
 isError={productsQuery.isError}
 onRetry={() => productsQuery.refetch()}
 page={productsPage}
 onPageChange={setProductsPage}
 emptyTitle="No products yet"
 emptyDescription="Add a product to begin."
 />
 </div>
 </section>

 <section aria-labelledby="inventory-movements" className="overflow-hidden rounded-lg border border-border bg-card">
 <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 sm:px-5 dark:from-orange-950/30 dark:via-stone-950 dark:to-yellow-950/10">
 <div className="flex items-center gap-3">
 <div>
 <h2 id="inventory-movements" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Stock movements</h2>
 </div>
 </div>
 <Link href="/command-center" className="hidden min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold text-amber-700 transition hover:bg-amber-500/10 sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
 Watchlist <ArrowRight className="size-3.5" aria-hidden="true" />
 </Link>
 </div>
 <div className="p-4 sm:p-5">
 <DataTable
 columns={movementColumns}
 data={movementsQuery.data}
 isLoading={movementsQuery.isLoading}
 isError={movementsQuery.isError}
 onRetry={() => movementsQuery.refetch()}
 page={movementsPage}
 onPageChange={setMovementsPage}
 emptyTitle="No stock movements yet"
 />
 </div>
 </section>

 <InventoryOperationsPanel />
 </div>
 </div>
 );
}
