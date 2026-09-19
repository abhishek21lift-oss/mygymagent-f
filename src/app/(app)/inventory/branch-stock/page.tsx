"use client"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryBranchStock } from "@/lib/hooks/use-inventory"
import { useBranches } from "@/lib/hooks/use-branches"

export default function BranchStockPage(){
 const branches=useBranches({page:1,pageSize:100})
 const [branchId,setBranchId]=React.useState("")
 const [search,setSearch]=React.useState("")
 const q=useInventoryBranchStock({branchId:branchId||undefined})
 const rows=(q.data??[]).filter(x=>!search || x.product?.name?.toLowerCase().includes(search.toLowerCase()) || x.product?.sku?.toLowerCase().includes(search.toLowerCase()))
 return <InventoryResourceShell title="Branch Stock" description="Live stock by branch, product and SKU.">
  <div className="flex flex-wrap gap-3">
   <select value={branchId} onChange={e=>setBranchId(e.target.value)} className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold"><option value="">All branches</option>{(branches.data?.items??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
   <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product or SKU" className="max-w-sm rounded-xl"/>
  </div>
  <div className="overflow-x-auto rounded-2xl border bg-white/85 shadow-sm"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="p-4">Product</th><th className="p-4">SKU</th><th className="p-4">Branch</th><th className="p-4 text-right">Units</th></tr></thead><tbody>{rows.map(x=><tr key={x.id} className="border-b last:border-0"><td className="p-4 font-bold">{x.product?.name}</td><td className="p-4 font-mono">{x.product?.sku}</td><td className="p-4">{x.branch?.name}</td><td className="p-4 text-right font-black tabular-nums">{x.quantityOnHand}</td></tr>)}{!q.isLoading&&!rows.length&&<tr><td colSpan={4} className="p-10 text-center text-stone-500">No branch stock found.</td></tr>}</tbody></table></div>
 </InventoryResourceShell>
}
