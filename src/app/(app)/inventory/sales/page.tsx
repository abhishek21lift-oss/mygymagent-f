"use client"
import { DataState } from "@/components/shared/data-state"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useCancelInventorySale,useInventorySales,useReturnInventorySale } from "@/lib/hooks/use-inventory"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function SalesPage(){
 const q=useInventorySales(); const ret=useReturnInventorySale(); const cancel=useCancelInventorySale()
 async function doReturn(id:string){try{await ret.mutateAsync(id);toast.success("Sale returned")}catch(e){toast.error(e instanceof Error?e.message:"Return failed")}}
 return <InventoryResourceShell title="Sales" description="Inventory sales history and stock-impacting transactions.">
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load sales." isEmpty={!(q.data?.length)} emptyTitle="No sales recorded" emptyDescription="Counter sales appear here once the first one is rung up." skeletonRows={5}>
 <div className="overflow-x-auto rounded-lg border bg-card shadow-sm"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="p-4">Sale</th><th className="p-4">Items</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4"></th></tr></thead><tbody>{(q.data??[]).map(s=><tr key={s.id} className="border-b last:border-0"><td className="p-4 font-black">{s.number}</td><td className="p-4">{s.items?.length||0}</td><td className="p-4 font-bold">{s.total}</td><td className="p-4">{s.status}</td><td className="p-4"><div className="flex justify-end gap-2">{s.status==="COMPLETED"&&<Button size="sm" variant="outline" disabled={ret.isPending} aria-busy={ret.isPending} onClick={()=>doReturn(s.id)}>{ret.isPending?"Returning...":"Return"}</Button>}{(s.status==="COMPLETED"||s.status==="PARTIALLY_RETURNED")&&<ConfirmAction label="Cancel" title={`Cancel sale ${s.number}?`} description="Every line not already returned goes back on hand and the sale is closed. A cancelled sale cannot be reopened." confirmLabel="Cancel sale" pendingLabel="Cancelling..." successMessage="Sale cancelled" errorMessage="Could not cancel this sale." onConfirm={()=>cancel.mutateAsync(s.id)}/>}</div></td></tr>)}</tbody></table></div>
 </DataState>
 </InventoryResourceShell>
}
