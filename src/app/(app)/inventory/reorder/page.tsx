"use client"
import * as React from "react"
import { PackageCheck } from "lucide-react"
import { DataState } from "@/components/shared/data-state"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryReorderSuggestions } from "@/lib/hooks/use-inventory"
import { useBranches } from "@/lib/hooks/use-branches"
import { Button } from "@/components/ui/button"

export default function ReorderPage(){
 const branches=useBranches({page:1,pageSize:100}); const [branchId,setBranchId]=React.useState("")
 const q=useInventoryReorderSuggestions(branchId||undefined)
 // "No reorder candidates." used to show on a failed fetch as readily as
 // on a healthy one, which on this page is the more expensive direction
 // to be wrong in: it reads as "nothing needs ordering".
 return <InventoryResourceShell title="Reorder Suggestions" description="Products at or below their configured reorder level.">
 <div className="flex flex-wrap gap-3"><select value={branchId} onChange={e=>setBranchId(e.target.value)} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold"><option value="">Organization stock</option>{(branches.data?.items??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load reorder suggestions." isEmpty={!(q.data?.length)} emptyIcon={PackageCheck} emptyTitle="Nothing needs reordering" emptyDescription="Every product is above its reorder level." skeletonRows={3}>
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(q.data??[]).map(x=><div key={x.productId} className="rounded-lg border border-amber-200 bg-amber-50/70 p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-black">{x.name}</h3><p className="mt-1 font-mono text-xs text-stone-500">{x.sku}</p></div><span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-black text-amber-800">LOW</span></div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div><p className="text-[10px] uppercase text-stone-500">On hand</p><p className="font-black">{x.quantityOnHand}</p></div><div><p className="text-[10px] uppercase text-stone-500">Level</p><p className="font-black">{x.reorderLevel}</p></div><div><p className="text-[10px] uppercase text-stone-500">Suggest</p><p className="font-black">{x.suggestedQuantity}</p></div></div><Button className="mt-4 w-full" variant="outline" disabled>Convert to PO</Button></div>)}</div>
 </DataState>
 </InventoryResourceShell>
}
