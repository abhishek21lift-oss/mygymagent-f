"use client"
import * as React from "react"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { lookupProductByScanCode } from "@/lib/hooks/use-inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Product } from "@/lib/types/gym"

export default function ScannerPage(){
 const [code,setCode]=React.useState(""); const [product,setProduct]=React.useState<Product | null>(null); const [loading,setLoading]=React.useState(false)
 async function scan(e:React.FormEvent){e.preventDefault();if(!code.trim())return;setLoading(true);try{setProduct(await lookupProductByScanCode(code.trim()));toast.success("Product found")}catch(e){setProduct(null);toast.error(e instanceof Error?e.message:"Product not found")}finally{setLoading(false)}}
 return <InventoryResourceShell title="QR / Barcode Scanner" description="Resolve a printed QR/barcode value to the tenant-scoped product record.">
 <form onSubmit={scan} className="mx-auto flex w-full max-w-xl gap-2"><Input autoFocus value={code} onChange={e=>setCode(e.target.value)} placeholder="Scan or type SKU / barcode" className="rounded-xl"/><Button disabled={loading}>{loading?"Scanning…":"Lookup"}</Button></form>
 {product&&<div className="mx-auto mt-6 w-full max-w-xl rounded-lg border bg-card p-6 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-stone-500">Product</p><h2 className="mt-1 text-2xl font-black">{product.name}</h2><p className="mt-1 font-mono text-sm text-stone-500">{product.sku} · {product.barcode||"No barcode"}</p><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">On hand</p><p className="text-xl font-black">{product.quantityOnHand}</p></div><div className="rounded-xl bg-stone-50 p-4"><p className="text-xs text-stone-500">Unit</p><p className="text-xl font-black">{product.unit||"unit"}</p></div></div></div>}
 </InventoryResourceShell>
}
