"use client"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useInventorySales,useReturnInventorySale } from "@/lib/hooks/use-inventory"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"

export default function ReturnsPage(){
 const q=useInventorySales("COMPLETED"); const ret=useReturnInventorySale()
 async function doReturn(id:string){try{await ret.mutateAsync(id);toast.success("Return processed")}catch(e){toast.error(e instanceof Error?e.message:"Return failed")}}
 return <InventoryResourceShell title="Returns" description="Completed sales eligible for return. The current backend contract performs full-sale returns.">
 <DataState isLoading={q.isPending} isError={q.isError} onRetry={()=>void q.refetch()} errorMessage="Could not load returns." isEmpty={(q.data??[]).length===0} emptyTitle="No returns yet" emptyDescription="Recorded returns will appear here."><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(q.data??[]).map(s=><div key={s.id} className="rounded-lg border bg-card p-5 shadow-sm"><div className="flex justify-between"><div><h3 className="font-black">{s.number}</h3><p className="text-sm text-stone-500">{s.items?.length||0} item(s)</p></div><span className="font-black">{s.total}</span></div><Button className="mt-4 w-full" variant="outline" onClick={()=>doReturn(s.id)}>Return entire sale</Button></div>)}{!q.isLoading&&!(q.data?.length)&&<div className="rounded-lg border bg-white p-10 text-center text-stone-500 md:col-span-2 xl:col-span-3">No completed sales waiting for return.</div>}</div></DataState>
 </InventoryResourceShell>
}
