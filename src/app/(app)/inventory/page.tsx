"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, PackagePlus, Boxes, AlertTriangle, ArrowRight, History, Package } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/shared/data-table";
import { ScanStockDialog } from "@/components/shared/scan-stock-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  useCreateProduct,
  useRecordStockMovement,
  useStockMovements,
} from "@/lib/hooks/use-inventory";
import { ApiError } from "@/lib/api/client";
import {
  createProductSchema,
  createStockMovementSchema,
  type CreateProductInput,
  type CreateStockMovementInput,
} from "@/lib/validation/gym";
import type { Product, StockMovement } from "@/lib/types/gym";

function AddProductDialog() {
  const [open, setOpen] = React.useState(false);
  const createProduct = useCreateProduct();

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      category: "",
      unitPrice: 0,
      costPrice: undefined,
      quantityOnHand: 0,
      reorderLevel: 0,
    },
  });

  async function onSubmit(values: CreateProductInput) {
    try {
      await createProduct.mutateAsync(values);
      toast.success("Product added");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Failed to add product");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[linear-gradient(105deg,#f59e0b,#f97316_55%,#ea580c)] px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-amber-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
          <Plus className="size-4" aria-hidden="true" />
          New product
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SHAKE-1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Supplements" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Vanilla Whey Protein" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost price (optional)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantityOnHand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting quantity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder level</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createProduct.isPending}>
                {createProduct.isPending ? "Adding..." : "Add product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

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
        <Button variant="outline" size="sm" className="min-h-11 rounded-xl border-amber-200/70 bg-amber-50/60 font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
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
            <div className="grid grid-cols-2 gap-4">
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
              <Button type="submit" disabled={recordMovement.isPending}>
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
  StockMovement["type"],
  "success" | "secondary" | "outline" | "destructive"
> = {
  RESTOCK: "success",
  SALE: "secondary",
  ADJUSTMENT: "outline",
  DAMAGED: "destructive",
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
    <div className="relative -mx-2 min-h-full overflow-hidden pb-12 sm:-mx-3 lg:-mx-5">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_5%_2%,rgba(6,182,212,.13),transparent_19%),radial-gradient(circle_at_96%_4%,rgba(99,102,241,.15),transparent_22%),radial-gradient(circle_at_70%_38%,rgba(217,70,239,.10),transparent_25%),radial-gradient(circle_at_12%_72%,rgba(16,185,129,.08),transparent_24%)]" aria-hidden="true" />
      <div className="mx-auto flex max-w-[1680px] flex-col gap-8 px-2 sm:px-4 lg:px-6">
        <section aria-labelledby="inventory-title" className="relative overflow-hidden rounded-[34px] border border-white/90 bg-white/88 p-6 shadow-[0_35px_110px_-48px_rgba(79,70,229,.48)] backdrop-blur-2xl sm:p-8 lg:p-10 dark:border-white/10 dark:bg-stone-950/80">
          <div className="pointer-events-none absolute -left-24 -top-32 size-80 rounded-full bg-amber-300/30 blur-3xl motion-safe:animate-blob" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full bg-orange-300/25 blur-3xl motion-safe:animate-blob motion-safe:[animation-delay:2.5s]" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-40 left-[35%] size-96 rounded-full bg-yellow-300/20 blur-3xl motion-safe:animate-pulse-slow" aria-hidden="true" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-amber-800">
                <Package className="size-3.5" aria-hidden="true" /> Stock command
              </div>
              <h1 id="inventory-title" className="font-serif text-4xl font-semibold tracking-[-.045em] text-stone-950 sm:text-5xl lg:text-6xl dark:text-white">Inventory OS</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-stone-600 dark:text-stone-400">Product catalog and stock movements — protect availability before the next stockout.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasPermission("inventory.read") && <ScanStockDialog />}
              {hasPermission("inventory.manage") && <AddProductDialog />}
            </div>
          </div>
        </section>

        <section aria-labelledby="inventory-pulse" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-4">
            <h2 id="inventory-pulse" className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">Stock pulse</h2>
            <p className="mt-1 text-xs font-medium text-stone-600 dark:text-stone-400">Catalog depth and reorder urgency at a glance.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-amber-200 hover:shadow-amber-500/10 dark:border-white/10 dark:bg-stone-950/80">
              <span className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-600" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full bg-amber-400/20 blur-2xl transition duration-300 group-hover:scale-125" aria-hidden="true" />
              <div className="relative flex items-center gap-4 p-5 lg:p-6">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <Boxes className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Products · this page</p>
                  {productsQuery.isLoading ? <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-stone-200/70" aria-label="Loading products" /> : <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">{productsQuery.data?.total ?? 0}</p>}
                  <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">Cataloged products</p>
                </div>
              </div>
            </div>
            <div className={`group relative overflow-hidden rounded-[22px] border bg-white/85 shadow-[0_20px_60px_-38px_rgba(79,70,229,.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 dark:bg-stone-950/80 ${lowStockCount > 0 ? "border-amber-300/80 hover:border-amber-300 hover:shadow-amber-500/15" : "border-white/90 hover:border-emerald-200 hover:shadow-emerald-500/10 dark:border-white/10"}`}>
              <span className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${lowStockCount > 0 ? "from-amber-400 via-orange-500 to-red-500" : "from-emerald-400 via-teal-500 to-green-600"}`} aria-hidden="true" />
              <div className={`pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl transition duration-300 group-hover:scale-125 ${lowStockCount > 0 ? "bg-amber-400/25" : "bg-emerald-400/20"}`} aria-hidden="true" />
              <div className="relative flex items-center gap-4 p-5 lg:p-6">
                <span className={`flex size-14 shrink-0 items-center justify-center rounded-[19px] bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ${lowStockCount > 0 ? "from-amber-500 to-orange-600 shadow-amber-500/30" : "from-emerald-500 to-teal-600 shadow-emerald-500/30"}`}>
                  <AlertTriangle className="size-6" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-stone-500">Low stock · this page</p>
                  {productsQuery.isLoading ? <div className="mt-2 h-7 w-16 animate-pulse rounded-lg bg-stone-200/70" aria-label="Loading low stock" /> : <p className="mt-1 text-2xl font-black tracking-tight text-stone-950 tabular-nums dark:text-white">{lowStockCount}</p>}
                  <p className="mt-1 text-[11px] font-medium text-stone-600 dark:text-stone-400">{lowStockCount > 0 ? "Reorder before stockout" : "Inventory looks healthy"}</p>
                </div>
                {!productsQuery.isLoading && lowStockCount > 0 && (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 ring-1 ring-amber-200/60">Reorder</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="inventory-products" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:100ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center gap-3 border-b border-stone-100/80 bg-gradient-to-r from-amber-50/90 via-white to-orange-50/60 px-5 py-5 sm:px-6 dark:from-amber-950/30 dark:via-stone-950 dark:to-orange-950/20">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
              <Package className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="inventory-products" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Products</h2>
              <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Catalog, pricing and reorder levels — low stock glows amber.</p>
            </div>
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
              emptyDescription="Add your first product to start tracking stock."
            />
          </div>
        </section>

        <section aria-labelledby="inventory-movements" className="overflow-hidden rounded-[28px] border border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:150ms] dark:border-white/10 dark:bg-stone-950/80">
          <div className="flex items-center justify-between gap-3 border-b border-stone-100/80 bg-gradient-to-r from-orange-50/90 via-white to-yellow-50/60 px-5 py-5 sm:px-6 dark:from-orange-950/30 dark:via-stone-950 dark:to-yellow-950/10">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25">
                <History className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="inventory-movements" className="font-serif text-xl font-semibold tracking-tight text-stone-950 dark:text-white">Stock movements</h2>
                <p className="mt-0.5 text-xs font-medium text-stone-600 dark:text-stone-400">Restocks, sales, adjustments and damage log.</p>
              </div>
            </div>
            <Link href="/command-center" className="hidden min-h-11 items-center gap-1 rounded-xl px-3 py-2 text-xs font-extrabold text-amber-700 transition hover:bg-amber-500/10 sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
              Low-stock watchlist <ArrowRight className="size-3.5" aria-hidden="true" />
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
      </div>
    </div>
  );
}
