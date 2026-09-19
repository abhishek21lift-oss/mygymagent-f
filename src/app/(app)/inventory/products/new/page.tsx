"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft, Barcode, Boxes, Check, PackagePlus, ScanBarcode, Tag } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { BarcodeCameraScanner } from "@/components/inventory/barcode-camera-scanner"
import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useCreateProduct } from "@/lib/hooks/use-inventory"
import {
  createProductSchema,
  type CreateProductInput,
} from "@/lib/validation/gym"
import { Button } from "@/components/ui/button
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

function Field({
  label,
  hint,
  ...props
}: React.ComponentProps<typeof Input> & {
  label: string
  hint?: string
}) {
  return (
    <FormItem>
      <FormLabel className="text-sm font-bold text-stone-800 dark:text-stone-100">
        {label}
      </FormLabel>
      <FormControl>
        <Input
          {...props}
          className="h-12 rounded-xl border-stone-200 bg-white/90 px-4 text-sm font-medium shadow-sm transition focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:border-white/10 dark:bg-stone-900/80"
        />
      </FormControl>
      {hint && <p className="text-xs font-medium leading-5 text-stone-500">{hint}</p>}
      <FormMessage />
    </FormItem>
  )
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof PackagePlus
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/90 bg-white/90 shadow-[0_24px_70px_-48px_rgba(79,70,229,.45)] backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/75">
      <div className="border-b border-stone-100/80 bg-gradient-to-r from-amber-50/80 via-white to-orange-50/60 px-5 py-5 sm:px-6 dark:border-white/10 dark:from-amber-950/20 dark:via-stone-950 dark:to-orange-950/10">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-stone-950 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm font-medium leading-5 text-stone-500">
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-5 p-5 sm:p-6">{children}</div>
    </section>
  )
}

export default function NewInventoryProductPage() {
  const { hasPermission } = useAuth()
  const router = useRouter()
  const createProduct = useCreateProduct()
  const [barcodeScannerOpen, setBarcodeScannerOpen] = React.useState(false)

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
      reorderQuantity: 0,
      barcode: "",
      unit: "unit",
    },
  })

  async function onSubmit(values: CreateProductInput) {
    try {
      await createProduct.mutateAsync(values)
      toast.success("Product added successfully")
      router.push("/inventory")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Failed to add product",
      )
    }
  }

  if (!hasPermission("inventory.manage")) {
    return (
      <InventoryResourceShell
        title="New Product"
        description="Create a product for your inventory catalogue."
      >
        <section className="rounded-2xl border border-amber-200/70 bg-white/90 p-8 text-center shadow-sm dark:border-white/10 dark:bg-stone-950/75">
          <PackagePlus className="mx-auto size-10 text-amber-600" />
          <h2 className="mt-4 text-lg font-extrabold text-stone-950 dark:text-white">
            Inventory management access required
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-stone-500">
            Your account can view inventory but cannot create products.
          </p>
          <Button asChild className="mt-6 rounded-xl">
            <Link href="/inventory">Back to inventory</Link>
          </Button>
        </section>
      </InventoryResourceShell>
    )
  }

  return (
    <InventoryResourceShell
      title="New Product"
      description="Create a clean inventory master record with pricing, stock and reorder controls."
      actions={
        <Button asChild variant="outline" className="rounded-xl bg-white/80">
          <Link href="/inventory">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to inventory
          </Link>
        </Button>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-6">
              <Section
                icon={Tag}
                title="Product identity"
                description="The information your team will use to find and recognize this product."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Field
                        {...field}
                        label="Product name"
                        placeholder="Vanilla Whey Protein"
                        autoFocus
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <Field
                        {...field}
                        label="SKU"
                        placeholder="WHEY-VAN-1KG"
                        hint="Use a unique internal stock code."
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Field
                        {...field}
                        label="Category"
                        placeholder="Supplements"
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <Field
                        {...field}
                        label="Unit"
                        placeholder="unit / pack / bottle"
                        hint="How one stock unit is measured."
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <div className="sm:col-span-2">
                        <FormItem>
                          <div className="flex items-center justify-between gap-3">
                            <FormLabel className="text-sm font-bold text-stone-800 dark:text-stone-100">
                              Barcode
                            </FormLabel>
                            <Dialog open={barcodeScannerOpen} onOpenChange={setBarcodeScannerOpen}>
                              <DialogTrigger asChild>
                                <Button type="button" variant="outline" size="sm" className="rounded-xl font-bold">
                                  <ScanBarcode className="size-4" aria-hidden="true" />
                                  Scan barcode
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Scan product barcode</DialogTitle>
                                  <DialogDescription>
                                    Point your camera at the printed barcode. The scanned value will be filled into this product form automatically.
                                  </DialogDescription>
                                </DialogHeader>
                                <BarcodeCameraScanner
                                  onCodeDetected={(code) => {
                                    field.onChange(code)
                                    setBarcodeScannerOpen(false)
                                    toast.success("Barcode scanned")
                                  }}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Scan barcode or enter manually"
                              inputMode="numeric"
                              autoComplete="off"
                              className="h-12 rounded-xl border-stone-200 bg-white/90 px-4 text-sm font-medium shadow-sm transition focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:border-white/10 dark:bg-stone-900/80"
                            />
                          </FormControl>
                          <p className="text-xs font-medium leading-5 text-stone-500">
                            Scan the product barcode with your phone camera, or enter the code manually if needed.
                          </p>
                          <FormMessage />
                        </FormItem>
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <div className="sm:col-span-2">
                        <FormItem>
                          <FormLabel className="text-sm font-bold text-stone-800 dark:text-stone-100">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={4}
                              placeholder="Short product description, variant or internal notes..."
                              className="resize-y rounded-xl border-stone-200 bg-white/90 px-4 py-3 text-sm font-medium shadow-sm focus-visible:border-amber-500 focus-visible:ring-amber-500/20 dark:border-white/10 dark:bg-stone-900/80"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      </div>
                    )}
                  />
                </div>
              </Section>

              <Section
                icon={Boxes}
                title="Pricing & opening stock"
                description="Set the selling price, cost basis and the opening quantity for this product."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <Field
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        label="Unit price"
                        placeholder="0.00"
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <Field
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        label="Cost price"
                        placeholder="0.00"
                        value={field.value ?? ""}
                        hint="Optional purchase/cost basis."
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quantityOnHand"
                    render={({ field }) => (
                      <Field
                        {...field}
                        type="number"
                        min="0"
                        step="1"
                        label="Starting quantity"
                        placeholder="0"
                        value={field.value ?? ""}
                        hint="Opening stock will be recorded through the inventory ledger."
                      />
                    )}
                  />
                </div>
              </Section>

              <Section
                icon={Barcode}
                title="Reorder controls"
                description="Define when the product should be flagged and how much to replenish."
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="reorderLevel"
                    render={({ field }) => (
                      <Field
                        {...field}
                        type="number"
                        min="0"
                        step="1"
                        label="Reorder level"
                        placeholder="0"
                        value={field.value ?? ""}
                        hint="Low-stock alert threshold."
                      />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reorderQuantity"
                    render={({ field }) => (
                      <Field
                        {...field}
                        type="number"
                        min="0"
                        step="1"
                        label="Reorder quantity"
                        placeholder="0"
                        value={field.value ?? ""}
                        hint="Suggested quantity for the next replenishment."
                      />
                    )}
                  />
                </div>
              </Section>
            </div>

            <aside className="h-fit xl:sticky xl:top-6">
              <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-[0_24px_70px_-48px_rgba(245,158,11,.55)] dark:border-amber-500/20 dark:from-amber-950/30 dark:via-stone-950 dark:to-orange-950/20">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/25">
                  <PackagePlus className="size-6" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-lg font-black tracking-tight text-stone-950 dark:text-white">
                  Ready to add
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-stone-600 dark:text-stone-400">
                  This creates the product master record and records the opening quantity in the stock ledger.
                </p>

                <div className="mt-5 grid gap-2 rounded-xl border border-white/80 bg-white/70 p-3 text-xs font-semibold text-stone-600 dark:border-white/10 dark:bg-white/5 dark:text-stone-300">
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600" />
                    SKU and barcode searchable
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600" />
                    Opening stock ledger entry
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-600" />
                    Reorder threshold configured
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    type="submit"
                    className="h-12 rounded-xl bg-[linear-gradient(105deg,#f59e0b,#f97316_55%,#ea580c)] font-extrabold text-white shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 hover:shadow-xl"
                    disabled={createProduct.isPending}
                  >
                    <PackagePlus className="size-4" aria-hidden="true" />
                    {createProduct.isPending ? "Adding product..." : "Add product"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 rounded-xl font-bold"
                    onClick={() => router.push("/inventory")}
                    disabled={createProduct.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </Form>
    </InventoryResourceShell>
  )
}
