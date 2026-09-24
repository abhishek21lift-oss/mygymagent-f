"use client"
import * as React from "react"
import { PackageCheck } from "lucide-react"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryReorderSuggestions, useInventorySuppliers, useCreateInventoryPurchaseOrder } from "@/lib/hooks/use-inventory"
import { useBranches } from "@/lib/hooks/use-branches"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ApiError } from "@/lib/api/client"

type Suggestion = { productId: string; sku: string; name: string; quantityOnHand: number; reorderLevel: number; suggestedQuantity: number }

/**
 * "Convert to PO" was `disabled` from the day it was written: a button
 * sitting on every low-stock card promising the one action the page
 * exists to lead to, and doing nothing. The purchase-order endpoint it
 * needed already existed -- it just wants a supplier and a unit cost,
 * neither of which the reorder suggestion carries, so this asks for them
 * and pre-fills the quantity the server suggested.
 */
// Mounted only while a card is converting, and keyed on the product, so
// each open starts from that product's suggested quantity. That is the
// reset-with-a-key idiom rather than an effect that re-seeds the fields
// when `item` changes -- there is no effect here to fall out of step.
function ConvertDialog({ item, branchId, onClose }: { item: Suggestion; branchId: string; onClose: () => void }) {
 const suppliers = useInventorySuppliers()
 const create = useCreateInventoryPurchaseOrder()
 const [supplierId, setSupplierId] = React.useState("")
 const [quantity, setQuantity] = React.useState(() => String(item.suggestedQuantity))
 const [unitCost, setUnitCost] = React.useState("")

 const qty = Number(quantity)
 const cost = Number(unitCost)
 const valid = Boolean(supplierId) && Number.isFinite(qty) && qty > 0 && Number.isFinite(cost) && cost >= 0

 async function submit() {
  if (!valid) return
  try {
   await create.mutateAsync({
    supplierId,
    branchId: branchId || undefined,
    items: [{ productId: item.productId, orderedQuantity: qty, unitCost: cost }],
   })
   toast.success(`Purchase order raised for ${item.name}`)
   onClose()
  } catch (e) {
   toast.error(e instanceof ApiError ? e.message : "Could not raise the purchase order")
  }
 }

 return <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
  <DialogContent>
   <DialogHeader>
    <DialogTitle>Convert to purchase order</DialogTitle>
    <DialogDescription>{`${item.name} · ${item.sku}`}</DialogDescription>
   </DialogHeader>
   <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1.5">
     <Label htmlFor="po-supplier">Supplier</Label>
     <select id="po-supplier" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="h-11 rounded-lg border border-border bg-card px-3 text-sm">
      <option value="">Select a supplier</option>
      {(suppliers.data ?? []).filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
     </select>
     {suppliers.isSuccess && !(suppliers.data ?? []).some(s => s.isActive) && <p className="text-xs text-muted-foreground">No active suppliers yet — add one under Suppliers first.</p>}
    </div>
    <div className="grid grid-cols-2 gap-3">
     <div className="flex flex-col gap-1.5">
      <Label htmlFor="po-qty">Quantity</Label>
      <Input id="po-qty" type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} className="h-11" />
     </div>
     <div className="flex flex-col gap-1.5">
      <Label htmlFor="po-cost">Unit cost</Label>
      <Input id="po-cost" type="number" min={0} step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="h-11" />
     </div>
    </div>
   </div>
   <DialogFooter>
    <Button variant="outline" className="min-h-11" onClick={onClose}>Cancel</Button>
    <Button className="min-h-11" disabled={!valid || create.isPending} aria-busy={create.isPending} onClick={submit}>{create.isPending ? "Raising..." : "Raise purchase order"}</Button>
   </DialogFooter>
  </DialogContent>
 </Dialog>
}

export default function ReorderPage(){
 const branches=useBranches({page:1,pageSize:100}); const [branchId,setBranchId]=React.useState("")
 const q=useInventoryReorderSuggestions(branchId||undefined)
 const [converting,setConverting]=React.useState<Suggestion|null>(null)
 // "No reorder candidates." used to show on a failed fetch as readily as
 // on a healthy one, which on this page is the more expensive direction
 // to be wrong in: it reads as "nothing needs ordering".
 return <InventoryResourceShell title="Reorder Suggestions" description="Products at or below their configured reorder level.">
 <div className="flex flex-wrap gap-3"><select value={branchId} onChange={e=>setBranchId(e.target.value)} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold"><option value="">Organization stock</option>{(branches.data?.items??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load reorder suggestions." isEmpty={!(q.data?.length)} emptyIcon={PackageCheck} emptyTitle="Nothing needs reordering" emptyDescription="Every product is above its reorder level." skeletonRows={3}>
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(q.data??[]).map(x=><div key={x.productId} className="rounded-lg border border-amber-200 bg-amber-50/70 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{x.name}</h3><p className="mt-1 font-mono text-xs text-stone-500">{x.sku}</p></div><span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-800">LOW</span></div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><p className="text-[10px] uppercase text-stone-500">On hand</p><p className="font-black">{x.quantityOnHand}</p></div><div><p className="text-[10px] uppercase text-stone-500">Level</p><p className="font-black">{x.reorderLevel}</p></div><div><p className="text-[10px] uppercase text-stone-500">Suggest</p><p className="font-black">{x.suggestedQuantity}</p></div></div><Button className="mt-4 min-h-11 w-full" variant="outline" onClick={()=>setConverting(x as Suggestion)}>Convert to PO</Button></div>)}</div>
 </DataState>
 {converting && <ConvertDialog key={converting.productId} item={converting} branchId={branchId} onClose={()=>setConverting(null)} />}
 </InventoryResourceShell>
}
