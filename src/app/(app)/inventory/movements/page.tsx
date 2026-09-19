"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useStockMovements } from "@/lib/hooks/use-inventory"

export default function MovementsPage(){
 const q=useStockMovements({page:1,pageSize:100,order:"desc"})
 return <InventoryResourceShell title="Stock Movements" description="Immutable operational ledger view for inventory changes.">
  <div className="overflow-x-auto rounded-2xl border bg-white/85 shadow-sm"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="p-4">Date</th><th className="p-4">Product</th><th className="p-4">Type</th><th className="p-4 text-right">Qty</th><th className="p-4">Branch</th><th className="p-4">Note</th></tr></thead><tbody>{(q.data?.items??[]).map(m=><tr key={m.id} className="border-b last:border-0"><td className="p-4">{new Date(m.createdAt).toLocaleString()}</td><td className="p-4 font-bold">{m.product?.name||"—"}</td><td className="p-4">{m.type}</td><td className="p-4 text-right font-black">{m.quantity}</td><td className="p-4">{m.branch?.name||"Org"}</td><td className="p-4 text-stone-500">{m.note||"—"}</td></tr>)}</tbody></table></div>
 </InventoryResourceShell>
}
