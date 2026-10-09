"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useCancelInventoryTransfer,useInventoryTransfers,useShipInventoryTransfer,useReceiveInventoryTransfer } from "@/lib/hooks/use-inventory"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"

export default function TransfersPage(){
 const q=useInventoryTransfers(); const ship=useShipInventoryTransfer(); const receive=useReceiveInventoryTransfer(); const cancel=useCancelInventoryTransfer()
 async function act(fn:()=>Promise<unknown>,msg:string){try{await fn();toast.success(msg)}catch(e){toast.error(e instanceof Error?e.message:"Operation failed")}}
 return <InventoryResourceShell title="Branch Transfers" description="Track transfer lifecycle from draft to in-transit to received.">
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load transfers." isEmpty={(q.data??[]).length===0} emptyTitle="No transfers yet" emptyDescription="Stock moved between branches will appear here."><div className="grid gap-3">{(q.data??[]).map(t=><div key={t.id} className="rounded-lg border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{t.number}</h3><p className="text-sm text-stone-500">{t.status}</p></div><div className="flex flex-wrap items-center gap-2">{t.status==="DRAFT"&&<Button onClick={()=>act(()=>ship.mutateAsync(t.id),"Transfer shipped")}>Ship</Button>}{t.status==="IN_TRANSIT"&&<Button onClick={()=>act(()=>receive.mutateAsync(t.id),"Transfer received")}>Receive</Button>}{(t.status==="DRAFT"||t.status==="IN_TRANSIT")&&<ConfirmAction label="Cancel" title={`Cancel ${t.number}?`} description={t.status==="IN_TRANSIT"?`The stock goes back on hand at ${t.fromBranch?.name||"the source branch"}. Only the source branch can cancel a transfer that has already shipped.`:"The draft is closed. Nothing has left the source branch yet, so no stock moves."} confirmLabel="Cancel transfer" pendingLabel="Cancelling..." successMessage="Transfer cancelled" errorMessage="Could not cancel this transfer." onConfirm={()=>cancel.mutateAsync(t.id)}/>}</div></div><div className="mt-4 text-sm text-stone-600">{t.fromBranch?.name||"Source"} → {t.toBranch?.name||"Destination"} · {t.items?.length||0} item(s)</div></div>)}{!q.isLoading&&!(q.data?.length)&&<div className="rounded-lg border bg-card p-10 text-center text-stone-500">No transfers.</div>}</div></DataState>
 </InventoryResourceShell>
}
