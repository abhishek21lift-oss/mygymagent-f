"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Plus, PackagePlus } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        <Button>
          <Plus />
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
        <Button variant="outline" size="sm">
          <PackagePlus className="size-3.5" />
          Adjust stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock for &quot;{product.name}&quot;</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Currently on hand: {product.quantityOnHand}
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
            <p className="text-xs text-muted-foreground">
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
  return (
    <div className="flex items-center gap-2">
      <span className={low ? "font-medium text-destructive" : ""}>
        {product.quantityOnHand}
      </span>
      {low && <Badge variant="destructive">Low stock</Badge>}
    </div>
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
    cell: ({ row }) => row.original.product?.name ?? "—",
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
    cell: ({ row }) => (row.original.quantity > 0 ? `+${row.original.quantity}` : row.original.quantity),
  },
  {
    header: "Note",
    accessorKey: "note",
    cell: ({ row }) => row.original.note ?? "—",
  },
  {
    header: "Date",
    accessorKey: "createdAt",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
  },
];

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [productsPage, setProductsPage] = React.useState(1);
  const productsQuery = useProducts({ page: productsPage, pageSize: 20 });
  const [movementsPage, setMovementsPage] = React.useState(1);
  const movementsQuery = useStockMovements({ page: movementsPage, pageSize: 10, order: "desc" });

  const productColumns: ColumnDef<Product>[] = [
    { header: "SKU", accessorKey: "sku" },
    { header: "Name", accessorKey: "name" },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => row.original.category ?? "—",
    },
    {
      header: "Price",
      accessorKey: "unitPrice",
      cell: ({ row }) => row.original.unitPrice,
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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Product catalog and stock movements"
        actions={hasPermission("inventory.manage") && <AddProductDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products (this page)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {productsQuery.data?.total ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low stock (this page)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{lowStockCount}</CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Products</h2>
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

      <div>
        <h2 className="mb-3 text-lg font-medium">Stock movements</h2>
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
    </div>
  );
}
