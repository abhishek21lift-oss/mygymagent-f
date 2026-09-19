"use client"

import * as React from "react"
import { ArrowDownToLine, ArrowRightLeft, RotateCcw, Truck, Users } from "lucide-react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useBranches } from "@/lib/hooks/use-branches"
import {
  useCreateInventoryPurchaseOrder,
  useCreateInventorySale,
  useCreateInventorySupplier,
  useCreateInventoryTransfer,
  useInventoryDashboard,
  useInventoryPurchaseOrders,
  useInventorySales,
  useInventorySuppliers,
  useInventoryTransfers,
  useReceiveInventoryPurchaseOrder,
  useReceiveInventoryTransfer,
  useReturnInventorySale,
  useShipInventoryTransfer,
  useProducts,
} from "@/lib/hooks/use-inventory"
import { Button } from "@/components/ui/button"
import { InventoryNav } from "@/components/inventory/inventory-nav"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function Field(props: React.ComponentProps<typeof Input> & { label: string }) {
  const { label, ...input } = props
  return (
    <label className="grid gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400">
      {label}
      <Input className="h-10 rounded-xl" {...input} />
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <label className="grid gap-1.5 text-xs font-bold text-stone-600 dark:text-stone-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-900 outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-white/10 dark:bg-stone-900 dark:text-white"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

export function InventoryOperationsPanel() {
  const { hasPermission } = useAuth()
  const dashboard = useInventoryDashboard()
  const branches = useBranches({ page: 1, pageSize: 100 })
  const products = useProducts({ page: 1, pageSize: 100, isActive: true })
  const suppliers = useInventorySuppliers()
  const purchaseOrders = useInventoryPurchaseOrders()
  const transfers = useInventoryTransfers()
  const sales = useInventorySales()

  const createSupplier = useCreateInventorySupplier()
  const createPurchaseOrder = useCreateInventoryPurchaseOrder()
  const receivePurchaseOrder = useReceiveInventoryPurchaseOrder()
  const createTransfer = useCreateInventoryTransfer()
  const shipTransfer = useShipInventoryTransfer()
  const receiveTransfer = useReceiveInventoryTransfer()
  const createSale = useCreateInventorySale()
  const returnSale = useReturnInventorySale()

  const [supplierName, setSupplierName] = React.useState("")
  const [po, setPo] = React.useState({ supplierId: "", branchId: "", productId: "", quantity: "1", unitCost: "0" })
  const [transfer, setTransfer] = React.useState({ from: "", to: "", productId: "", quantity: "1" })
  const [sale, setSale] = React.useState({ branchId: "", productId: "", quantity: "1", unitPrice: "" })

  const run = async (fn: () => Promise<unknown>, message: string) => {
    try { await fn(); toast.success(message) } catch (e) { toast.error(e instanceof ApiError ? e.message : "Inventory operation failed") }
  }

  if (!hasPermission("inventory.read")) return null

  const branchOptions = (branches.data?.items ?? []).map((b) => ({ value: b.id, label: b.name }))
  const productOptions = (products.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.name} · ${p.sku}` }))
  const supplierOptions = (suppliers.data ?? []).map((s) => ({ value: s.id, label: s.name }))
  const selectedSaleProduct = (products.data?.items ?? []).find((p) => p.id === sale.productId)

  return (
    <section className="grid gap-5" aria-labelledby="inventory-operations">
      <InventoryNav />
      <div>
        <h2 id="inventory-operations" className="font-serif text-2xl font-semibold tracking-tight text-stone-950 dark:text-white">Operations</h2>
        <p className="mt-1 text-sm font-medium text-stone-500">Procure, receive, transfer and sell without bypassing the stock ledger.</p>
      </div>

      {dashboard.data && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Inventory value", dashboard.data.inventoryCostValue.toFixed(2)],
            ["Open POs", dashboard.data.openPurchaseOrders],
            ["Transfers", dashboard.data.transfersInTransit],
            ["Sales", dashboard.data.salesTotal.toFixed(2)],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/70">
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-stone-500">{label}</p>
              <p className="mt-2 text-xl font-black tabular-nums text-stone-950 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {hasPermission("inventory.manage") && (
        <div className="grid gap-4 lg:grid-cols-4">
          <form
            className="grid gap-3 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/75"
            onSubmit={(e) => { e.preventDefault(); if (!supplierName.trim()) return; void run(() => createSupplier.mutateAsync({ name: supplierName.trim() }), "Supplier created").then(() => setSupplierName("")) }}
          >
            <div className="flex items-center gap-2"><Users className="size-4 text-indigo-600" /><h3 className="font-bold">Supplier</h3></div>
            <Field label="Supplier name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="ABC Nutrition" required />
            <Button type="submit" disabled={createSupplier.isPending}>Add supplier</Button>
          </form>

          <form
            className="grid gap-3 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/75"
            onSubmit={(e) => {
              e.preventDefault()
              if (!po.supplierId || !po.productId) return
              void run(() => createPurchaseOrder.mutateAsync({
                supplierId: po.supplierId, branchId: po.branchId || undefined,
                items: [{ productId: po.productId, orderedQuantity: Number(po.quantity), unitCost: Number(po.unitCost) }],
              }), "Purchase order created")
            }}
          >
            <div className="flex items-center gap-2"><Truck className="size-4 text-emerald-600" /><h3 className="font-bold">Purchase order</h3></div>
            <SelectField label="Supplier" value={po.supplierId} onChange={(v) => setPo((x) => ({ ...x, supplierId: v }))} options={supplierOptions} />
            <SelectField label="Destination branch" value={po.branchId} onChange={(v) => setPo((x) => ({ ...x, branchId: v }))} options={branchOptions} placeholder="Org stock" />
            <SelectField label="Product" value={po.productId} onChange={(v) => setPo((x) => ({ ...x, productId: v }))} options={productOptions} />
            <div className="grid grid-cols-2 gap-2"><Field label="Qty" type="number" min="1" value={po.quantity} onChange={(e) => setPo((x) => ({ ...x, quantity: e.target.value }))} /><Field label="Unit cost" type="number" min="0" step="0.01" value={po.unitCost} onChange={(e) => setPo((x) => ({ ...x, unitCost: e.target.value }))} /></div>
            <Button type="submit" disabled={createPurchaseOrder.isPending}>Create PO</Button>
          </form>

          <form
            className="grid gap-3 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/75"
            onSubmit={(e) => {
              e.preventDefault()
              if (!transfer.from || !transfer.to || !transfer.productId) return
              void run(() => createTransfer.mutateAsync({
                fromBranchId: transfer.from, toBranchId: transfer.to,
                items: [{ productId: transfer.productId, quantity: Number(transfer.quantity) }],
              }), "Transfer created")
            }}
          >
            <div className="flex items-center gap-2"><ArrowRightLeft className="size-4 text-violet-600" /><h3 className="font-bold">Branch transfer</h3></div>
            <SelectField label="From" value={transfer.from} onChange={(v) => setTransfer((x) => ({ ...x, from: v }))} options={branchOptions} />
            <SelectField label="To" value={transfer.to} onChange={(v) => setTransfer((x) => ({ ...x, to: v }))} options={branchOptions} />
            <SelectField label="Product" value={transfer.productId} onChange={(v) => setTransfer((x) => ({ ...x, productId: v }))} options={productOptions} />
            <Field label="Qty" type="number" min="1" value={transfer.quantity} onChange={(e) => setTransfer((x) => ({ ...x, quantity: e.target.value }))} />
            <Button type="submit" disabled={createTransfer.isPending}>Create transfer</Button>
          </form>

          <form
            className="grid gap-3 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/75"
            onSubmit={(e) => {
              e.preventDefault()
              if (!sale.productId) return
              const price = Number(sale.unitPrice || selectedSaleProduct?.unitPrice || 0)
              void run(() => createSale.mutateAsync({
                branchId: sale.branchId || undefined,
                items: [{ productId: sale.productId, quantity: Number(sale.quantity), unitPrice: price }],
              }), "Sale recorded")
            }}
          >
            <div className="flex items-center gap-2"><ArrowDownToLine className="size-4 text-amber-600" /><h3 className="font-bold">Quick sale</h3></div>
            <SelectField label="Branch" value={sale.branchId} onChange={(v) => setSale((x) => ({ ...x, branchId: v }))} options={branchOptions} placeholder="Org stock" />
            <SelectField label="Product" value={sale.productId} onChange={(v) => setSale((x) => ({ ...x, productId: v }))} options={productOptions} />
            <div className="grid grid-cols-2 gap-2"><Field label="Qty" type="number" min="1" value={sale.quantity} onChange={(e) => setSale((x) => ({ ...x, quantity: e.target.value }))} /><Field label="Unit price" type="number" min="0" step="0.01" value={sale.unitPrice || selectedSaleProduct?.unitPrice || ""} onChange={(e) => setSale((x) => ({ ...x, unitPrice: e.target.value }))} /></div>
            <Button type="submit" disabled={createSale.isPending}>Complete sale</Button>
          </form>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/70">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Purchase orders</h3><Badge variant="secondary">{purchaseOrders.data?.length ?? 0}</Badge></div>
          <div className="grid gap-2">
            {(purchaseOrders.data ?? []).slice(0, 6).map((po) => (
              <div key={po.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 p-3 dark:border-white/10">
                <div><p className="text-sm font-bold">{po.number}</p><p className="text-xs text-stone-500">{po.supplier?.name ?? "Supplier"} · {po.status}</p></div>
                {hasPermission("inventory.manage") && (po.status === "ORDERED" || po.status === "PARTIALLY_RECEIVED") && (
                  <Button size="sm" variant="outline" onClick={() => void run(() => receivePurchaseOrder.mutateAsync({ id: po.id, input: { items: po.items.map((i) => ({ productId: i.productId, quantity: i.orderedQuantity - i.receivedQuantity })) } }), "PO received")}>Receive</Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/70">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Transfers</h3><Badge variant="secondary">{transfers.data?.length ?? 0}</Badge></div>
          <div className="grid gap-2">
            {(transfers.data ?? []).slice(0, 6).map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 p-3 dark:border-white/10">
                <div><p className="text-sm font-bold">{transfer.number}</p><p className="text-xs text-stone-500">{transfer.status}</p></div>
                {hasPermission("inventory.manage") && transfer.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => void run(() => shipTransfer.mutateAsync(transfer.id), "Transfer shipped")}>Ship</Button>}
                {hasPermission("inventory.manage") && transfer.status === "IN_TRANSIT" && <Button size="sm" variant="outline" onClick={() => void run(() => receiveTransfer.mutateAsync(transfer.id), "Transfer received")}>Receive</Button>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-stone-950/70">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Recent sales</h3><Badge variant="secondary">{sales.data?.length ?? 0}</Badge></div>
          <div className="grid gap-2">
            {(sales.data ?? []).slice(0, 6).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 p-3 dark:border-white/10">
                <div><p className="text-sm font-bold">{sale.number}</p><p className="text-xs text-stone-500">{sale.total} · {sale.status}</p></div>
                {hasPermission("inventory.manage") && sale.status === "COMPLETED" && <Button size="sm" variant="outline" onClick={() => void run(() => returnSale.mutateAsync(sale.id), "Sale returned") }><RotateCcw className="mr-1 size-3" />Return</Button>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
