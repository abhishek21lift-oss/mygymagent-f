"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ScanBarcode, PackageSearch } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useRecordStockMovement } from "@/lib/hooks/use-inventory";
import {
  createStockMovementSchema,
  type CreateStockMovementInput,
} from "@/lib/validation/gym";
import type { Product } from "@/lib/types/gym";
import { ApiError } from "@/lib/api/client";
import { ProductScanner } from "./product-scanner";

/** A scan-driven entry into the SAME stock-movement flow the manual
 * "Adjust stock" dialog uses: scan -> resolve product (backend decides
 * the match) -> fill the existing movement form -> the existing
 * POST /products/:id/stock-movements endpoint records it. No separate
 * stock-mutation path is added. */
export function ScanStockDialog() {
  const [open, setOpen] = React.useState(false);
  const [product, setProduct] = React.useState<Product | null>(null);
  const [scanCode, setScanCode] = React.useState<string | null>(null);
  const recordMovement = useRecordStockMovement();

  const form = useForm<CreateStockMovementInput>({
    resolver: zodResolver(createStockMovementSchema),
    defaultValues: { type: "RESTOCK", quantity: 1, note: "" },
  });

  function resetForNextScan() {
    setProduct(null);
    setScanCode(null);
    form.reset({ type: "RESTOCK", quantity: 1, note: "" });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) resetForNextScan();
  }

  function handleProductDetected(detected: Product, code: string) {
    setProduct(detected);
    setScanCode(code);
  }

  async function onSubmit(values: CreateStockMovementInput) {
    if (!product) return;
    try {
      await recordMovement.mutateAsync({ productId: product.id, input: values });
      toast.success(`Stock movement recorded for ${product.name}`);
      resetForNextScan();
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to record movement",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ScanBarcode className="size-4" aria-hidden />
          Scan QR / Barcode
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scan a product</DialogTitle>
          <DialogDescription>
            Scan the product&apos;s QR code or barcode with the camera, or type
            the code. Then record a stock movement for the detected product.
          </DialogDescription>
        </DialogHeader>

        {!product ? (
          <div className="flex flex-col gap-3">
            <ProductScanner
              onProductDetected={handleProductDetected}
              onUnknownCode={(code) => setScanCode(code)}
            />
            {scanCode && (
              <p className="text-sm text-muted-foreground">
                No product is mapped to code &quot;{scanCode}&quot;. Products are
                matched by their SKU — an admin can set a product&apos;s SKU to
                this barcode value (or code it as a custom SKU) in the product
                form, then rescan.
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    SKU {product.sku}
                    {product.category ? ` · ${product.category}` : ""}
                  </p>
                </div>
                <Badge
                  variant={
                    product.quantityOnHand <= product.reorderLevel
                      ? "destructive"
                      : "secondary"
                  }
                >
                  On hand: {product.quantityOnHand}
                </Badge>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
              >
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
                        <Input
                          placeholder="Delivery, sale, recount, ..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForNextScan}
                    disabled={recordMovement.isPending}
                  >
                    <PackageSearch className="size-4" aria-hidden />
                    Scan next product
                  </Button>
                  <Button type="submit" disabled={recordMovement.isPending}>
                    {recordMovement.isPending ? "Saving..." : "Record movement"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
