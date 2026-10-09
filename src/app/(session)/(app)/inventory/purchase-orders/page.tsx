"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useCancelInventoryPurchaseOrder,useInventoryPurchaseOrders,useReceiveInventoryPurchaseOrder } from "@/lib/hooks/use-inventory"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"

// The API accepts a cancel up to and including a partly-received order; once
// it is fully received or already cancelled it refuses, so the button is not
// offered in those states.
const CANCELLABLE=new Set(["DRAFT","ORDERED","PARTIALLY_RECEIVED"])

export default function PurchaseOrdersPage(){
 const q=useInventoryPurchaseOrders(); const receive=useReceiveInventoryPurchaseOrder(); const cancel=useCancelInventoryPurchaseOrder()
 async function recv(id:string,items:Array<{productId:string;orderedQuantity:number;receivedQuantity:number}>){try{await receive.mutateAsync({id,input:{items:items.filter(x=>x.orderedQuantity>x.receivedQuantity).map(x=>({productId:x.productId,quantity:x.orderedQuantity-x.receivedQuantity}))}});toast.success("Purchase order received")}catch(e){toast.error(e instanceof Error?e.message:"Receive failed")}}
 return <InventoryResourceShell title="Purchase Orders" description="Create and receive supplier orders; partial receiving remains supported by the API.">
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load purchase orders." isEmpty={(q.data??[]).length===0} emptyTitle="No purchase orders yet" emptyDescription="Raise one to start tracking incoming stock."><div className="grid gap-3">{(q.data??[]).map(po=><div key={po.id} className="rounded-lg border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{po.number}</h3><p className="text-sm text-stone-500">{po.supplier?.name||"Supplier"} · {po.status}</p></div><div className="flex flex-wrap items-center gap-2">{(po.status==="ORDERED"||po.status==="PARTIALLY_RECEIVED")&&<Button onClick={()=>recv(po.id,po.items)}>Receive remaining</Button>}{CANCELLABLE.has(po.status)&&<ConfirmAction label="Cancel order" title={`Cancel ${po.number}?`} description={po.status==="PARTIALLY_RECEIVED"?"Stock already received stays on hand. The outstanding lines are closed and cannot be received afterwards.":"The order is closed and cannot be received afterwards."} confirmLabel="Cancel order" pendingLabel="Cancelling..." successMessage="Purchase order cancelled" errorMessage="Could not cancel this purchase order." onConfirm={()=>cancel.mutateAsync(po.id)}/>}</div></div><div className="mt-4 grid gap-2">{po.items.map(i=><div key={i.id} className="flex justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"><span>{i.productId}</span><span className="font-bold">{i.receivedQuantity}/{i.orderedQuantity}</span></div>)}</div></div>)}{!q.isLoading&&!(q.data?.length)&&<div className="rounded-lg border bg-card p-10 text-center text-stone-500">No purchase orders.</div>}</div></DataState>
 </InventoryResourceShell>
}
