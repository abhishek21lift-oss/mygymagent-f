"use client"
import { DataState } from "@/components/shared/data-state"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryDashboard,useInventoryReorderSuggestions } from "@/lib/hooks/use-inventory"

export default function ReportsPage(){
 const d=useInventoryDashboard(); const r=useInventoryReorderSuggestions()
 // Every tile ended in `?? 0`, so an unreachable API reported a tidy
 // warehouse: no low stock, no open POs, nothing to reorder. Both
 // queries feed the grid, so either one failing makes the whole snapshot
 // untrustworthy rather than partly wrong.
 return <InventoryResourceShell title="Inventory Reports" description="Operational snapshot assembled from the authoritative inventory endpoints.">
 <DataState isLoading={d.isPending||r.isPending} isError={d.isError||r.isError} onRetry={()=>{void d.refetch();void r.refetch()}} errorMessage="Could not load the inventory snapshot." emptyTitle="Inventory reports" skeletonRows={4}>
 <div className="grid gap-4 md:grid-cols-2">{[
 ["Active products",d.data?.activeProducts??0],["Low stock products",d.data?.lowStockProducts??0],["Total units",d.data?.totalUnits??0],["Active suppliers",d.data?.activeSuppliers??0],["Open purchase orders",d.data?.openPurchaseOrders??0],["Transfers in transit",d.data?.transfersInTransit??0],["Sales total",d.data?.salesTotal??0],["Reorder candidates",r.data?.length??0]
 ].map(([k,v])=><div key={String(k)} className="rounded-lg border bg-card p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-stone-500">{k}</p><p className="mt-2 text-2xl font-black tabular-nums">{String(v)}</p></div>)}</div>
 </DataState>
 </InventoryResourceShell>
}
