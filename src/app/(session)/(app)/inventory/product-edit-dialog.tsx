"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { ApiError } from "@/lib/api/client";
import { useProduct, useUpdateProduct } from "@/lib/hooks/use-inventory";
import type { Product } from "@/lib/types/gym";
import { updateProductSchema, type UpdateProductInput } from "@/lib/validation/gym";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import {
 Form,
 FormControl,
 FormField,
 FormItem,
 FormLabel,
 FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function EditForm({ product, onDone }: { product: Product; onDone: () => void }) {
 const update = useUpdateProduct();
 const form = useForm<UpdateProductInput>({
  resolver: zodResolver(updateProductSchema),
  defaultValues: {
   sku: product.sku,
   name: product.name,
   description: product.description ?? "",
   category: product.category ?? "",
   barcode: product.barcode ?? "",
   unit: product.unit ?? "",
   // Money arrives as a Prisma Decimal serialised to a string; the form
   // works in numbers and the schema coerces on the way back out.
   unitPrice: Number(product.unitPrice),
   costPrice: product.costPrice === null ? undefined : Number(product.costPrice),
   reorderLevel: product.reorderLevel,
   reorderQuantity: product.reorderQuantity,
   isActive: product.isActive,
  },
 });

 async function submit(values: UpdateProductInput) {
  try {
   await update.mutateAsync({ id: product.id, input: values });
   toast.success("Product updated");
   onDone();
  } catch (error) {
   toast.error(error instanceof ApiError ? error.message : "Could not update this product.");
  }
 }

 return (
  <Form {...form}>
   <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2">
     <FormField control={form.control} name="sku" render={({ field }) => (
      <FormItem><FormLabel>SKU</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
     )} />
     <FormField control={form.control} name="name" render={({ field }) => (
      <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
     )} />
    </div>
    <FormField control={form.control} name="description" render={({ field }) => (
     <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
    )} />
    <div className="grid gap-3 sm:grid-cols-3">
     <FormField control={form.control} name="category" render={({ field }) => (
      <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
     )} />
     <FormField control={form.control} name="unit" render={({ field }) => (
      <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="each" {...field} /></FormControl></FormItem>
     )} />
     <FormField control={form.control} name="barcode" render={({ field }) => (
      <FormItem><FormLabel>Barcode</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
     )} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
     <FormField control={form.control} name="unitPrice" render={({ field }) => (
      <FormItem><FormLabel>Selling price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
     )} />
     <FormField control={form.control} name="costPrice" render={({ field }) => (
      <FormItem><FormLabel>Cost price</FormLabel><FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ""} /></FormControl></FormItem>
     )} />
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
     <FormField control={form.control} name="reorderLevel" render={({ field }) => (
      <FormItem><FormLabel>Reorder level</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
     )} />
     <FormField control={form.control} name="reorderQuantity" render={({ field }) => (
      <FormItem><FormLabel>Reorder quantity</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
     )} />
    </div>
    <FormField control={form.control} name="isActive" render={({ field }) => (
     <FormItem className="flex items-center gap-2">
      <FormControl>
       <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
      </FormControl>
      <FormLabel className="!mt-0 font-medium">Available to sell</FormLabel>
     </FormItem>
    )} />
    {/* Stock is deliberately not editable here: it only moves through the
        movement ledger, and PATCH /products/:id rejects quantityOnHand. */}
    <p className="rounded-lg bg-muted/50 p-3 text-xs font-medium text-muted-foreground">
     On hand: {product.quantityOnHand}. Stock changes go through a stock movement so the ledger stays the record.
    </p>
    <DialogFooter>
     <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
     <Button type="submit" disabled={update.isPending} aria-busy={update.isPending}>
      {update.isPending ? "Saving..." : "Save product"}
     </Button>
    </DialogFooter>
   </form>
  </Form>
 );
}

function EditBody({ productId, onDone }: { productId: string; onDone: () => void }) {
 // Loaded fresh rather than taken from the table row: the row can be a page
 // old, and saving would then quietly write back stale values.
 const detail = useProduct(productId);
 if (detail.isPending) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /></div>;
 if (detail.isError || !detail.data) {
  return (
   <div className="space-y-3">
    <p role="alert" className="text-sm font-semibold text-destructive">Could not load this product.</p>
    <Button type="button" variant="outline" onClick={() => void detail.refetch()}>Try again</Button>
   </div>
  );
 }
 return <EditForm product={detail.data} onDone={onDone} />;
}

export function ProductEditDialog({ product }: { product: Product }) {
 const [open, setOpen] = React.useState(false);
 return (
  <>
   <Button type="button" size="sm" variant="ghost" className="min-h-11" onClick={() => setOpen(true)}>
    <Pencil className="size-3.5" aria-hidden="true" />
    <span className="sr-only sm:not-sr-only">Edit</span>
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>Edit {product.name}</DialogTitle>
      <DialogDescription>Pricing, categorisation and reorder thresholds.</DialogDescription>
     </DialogHeader>
     {open ? <EditBody productId={product.id} onDone={() => setOpen(false)} /> : null}
    </DialogContent>
   </Dialog>
  </>
 );
}
