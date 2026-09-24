"use client"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { DataState } from "@/components/shared/data-state"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryBranchStock } from "@/lib/hooks/use-inventory"
import { useBranches } from "@/lib/hooks/use-branches"

export default function BranchStockPage(){
 const branches=useBranches({page:1,pageSize:100})
 const [branchId,setBranchId]=React.useState("")
 const [search,setSearch]=React.useState("")
 const q=useInventoryBranchStock({branchId:branchId||undefined})
 const rows=(q.data??[]).filter(x=>!search || x.product?.name?.toLowerCase().includes(search.toLowerCase()) || x.product?.sku?.toLowerCase().includes(search.toLowerCase()))
 // The old `!q.isLoading && !rows.length` row said "No branch stock
 // found." whether the branch was empty or the request had failed, so a
 // dropped connection read as an emptied warehouse. Empty now also
 // distinguishes "nothing here" from "nothing matches what you typed".
 return <InventoryResourceShell title="Branch Stock" description="Live stock by branch, product and SKU.">
 <div className="flex flex-wrap gap-3">
 <select value={branchId} onChange={e=>setBranchId(e.target.value)} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold"><option value="">All branches</option>{(branches.data?.items??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
 <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product or SKU" className="max-w-sm rounded-xl"/>
 </div>
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load branch stock." isEmpty={!rows.length} emptyTitle={search?"No matching products":"No branch stock yet"} emptyDescription={search?"No product name or SKU here matches that search.":"Stock appears here once this branch holds any."} skeletonRows={5}>
 <div className="overflow-x-auto rounded-lg border bg-card shadow-sm"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="p-4">Product</th><th className="p-4">SKU</th><th className="p-4">Branch</th><th className="p-4 text-right">Units</th></tr></thead><tbody>{rows.map(x=><tr key={x.id} className="border-b last:border-0"><td className="p-4 font-bold">{x.product?.name}</td><td className="p-4 font-mono">{x.product?.sku}</td><td className="p-4">{x.branch?.name}</td><td className="p-4 text-right font-black tabular-nums">{x.quantityOnHand}</td></tr>)}</tbody></table></div>
 </DataState>
 </InventoryResourceShell>
}
