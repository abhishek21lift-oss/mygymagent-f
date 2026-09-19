"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventoryTransfers,useShipInventoryTransfer,useReceiveInventoryTransfer } from "@/lib/hooks/use-inventory"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function TransfersPage(){
 const q=useInventoryTransfers(); const ship=useShipInventoryTransfer(); const receive=useReceiveInventoryTransfer()
 async function act(fn:()=>Promise<unknown>,msg:string){try{await fn();toast.success(msg)}catch(e){toast.error(e instanceof Error?e.message:"Operation failed")}}
 return <InventoryResourceShell title="Branch Transfers" description="Track transfer lifecycle from draft to in-transit to received.">
  <div className="grid gap-3">{(q.data??[]).map(t=><div key={t.id} className="rounded-2xl border bg-white/85 p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{t.number}</h3><p className="text-sm text-stone-500">{t.status}</p></div>{t.status==="DRAFT"&&<Button onClick={()=>act(()=>ship.mutateAsync(t.id),"Transfer shipped")}>Ship</Button>}{t.status==="IN_TRANSIT"&&<Button onClick={()=>act(()=>receive.mutateAsync(t.id),"Transfer received")}>Receive</Button>}</div><div className="mt-4 text-sm text-stone-600">{t.fromBranch?.name||"Source"} → {t.toBranch?.name||"Destination"} · {t.items?.length||0} item(s)</div></div>)}{!q.isLoading&&!(q.data?.length)&&<div className="rounded-2xl border bg-white p-10 text-center text-stone-500">No transfers.</div>}</div>
 </InventoryResourceShell>
}
