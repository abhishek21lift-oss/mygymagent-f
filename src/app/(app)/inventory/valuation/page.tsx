"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryDashboard } from "@/lib/hooks/use-inventory"

export default function ValuationPage(){
 const q=useInventoryDashboard(); const d=q.data
 return <InventoryResourceShell title="Inventory Valuation" description="Organization-level inventory cost valuation from the current inventory dashboard contract.">
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Inventory cost value",d?.inventoryCostValue],["Active products",d?.activeProducts],["Total units",d?.totalUnits],["Low stock",d?.lowStockProducts]].map(([k,v])=><div key={String(k)} className="rounded-2xl border bg-white/85 p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-stone-500">{k}</p><p className="mt-2 text-3xl font-black tabular-nums">{q.isLoading?"…":String(v??0)}</p></div>)}</div>
 </InventoryResourceShell>
}
