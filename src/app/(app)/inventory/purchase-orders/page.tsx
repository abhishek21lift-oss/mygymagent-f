"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryPurchaseOrders,useReceiveInventoryPurchaseOrder } from "@/lib/hooks/use-inventory"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function PurchaseOrdersPage(){
 const q=useInventoryPurchaseOrders(); const receive=useReceiveInventoryPurchaseOrder()
 async function recv(id:string,items:Array<{productId:string;orderedQuantity:number;receivedQuantity:number}>){try{await receive.mutateAsync({id,input:{items:items.filter(x=>x.orderedQuantity>x.receivedQuantity).map(x=>({productId:x.productId,quantity:x.orderedQuantity-x.receivedQuantity}))}});toast.success("Purchase order received")}catch(e){toast.error(e instanceof Error?e.message:"Receive failed")}}
 return <InventoryResourceShell title="Purchase Orders" description="Create and receive supplier orders; partial receiving remains supported by the API.">
 <div className="grid gap-3">{(q.data??[]).map(po=><div key={po.id} className="rounded-lg border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{po.number}</h3><p className="text-sm text-stone-500">{po.supplier?.name||"Supplier"} · {po.status}</p></div>{(po.status==="ORDERED"||po.status==="PARTIALLY_RECEIVED")&&<Button onClick={()=>recv(po.id,po.items)}>Receive remaining</Button>}</div><div className="mt-4 grid gap-2">{po.items.map(i=><div key={i.id} className="flex justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm"><span>{i.productId}</span><span className="font-bold">{i.receivedQuantity}/{i.orderedQuantity}</span></div>)}</div></div>)}{!q.isLoading&&!(q.data?.length)&&<div className="rounded-lg border bg-white p-10 text-center text-stone-500">No purchase orders.</div>}</div>
 </InventoryResourceShell>
}
