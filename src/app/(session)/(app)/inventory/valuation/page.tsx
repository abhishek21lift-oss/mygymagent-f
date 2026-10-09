"use client"
import { DataState } from "@/components/shared/data-state"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryDashboard } from "@/lib/hooks/use-inventory"

export default function ValuationPage(){
 const q=useInventoryDashboard(); const d=q.data
 // Without the error branch a failed fetch left `d` undefined and every
 // tile fell through to its `?? 0`, so a dead connection rendered as a
 // confident "Inventory cost value: 0". A valuation that reads zero is
 // worse than one that admits it could not load.
 return <InventoryResourceShell title="Inventory Valuation" description="Organization-level inventory cost valuation from the current inventory dashboard contract.">
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load the inventory valuation." emptyTitle="Inventory valuation" skeletonRows={4}>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Inventory cost value",d?.inventoryCostValue],["Active products",d?.activeProducts],["Total units",d?.totalUnits],["Low stock",d?.lowStockProducts]].map(([k,v])=><div key={String(k)} className="rounded-lg border bg-card p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-stone-500">{k}</p><p className="mt-2 text-3xl font-black tabular-nums">{String(v??0)}</p></div>)}</div>
 </DataState>
 </InventoryResourceShell>
}
