"use client"
import * as React from "react"
import { InventoryResourceShell } from "@/components/inventory/inventory-resource-shell"
import { useCreateInventorySupplier,useInventorySuppliers } from "@/lib/hooks/use-inventory"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ApiError } from "@/lib/api/client"

export default function SuppliersPage(){
 const q=useInventorySuppliers(); const create=useCreateInventorySupplier(); const [name,setName]=React.useState(""); const [phone,setPhone]=React.useState(""); const [email,setEmail]=React.useState("")
 async function submit(e:React.FormEvent){e.preventDefault(); if(!name.trim())return; try{await create.mutateAsync({name:name.trim(),phone:phone||undefined,email:email||undefined});toast.success("Supplier created");setName("");setPhone("");setEmail("")}catch(e){toast.error(e instanceof ApiError?e.message:"Failed to create supplier")}}
 return <InventoryResourceShell title="Suppliers" description="Manage inventory suppliers and their contact details.">
  <form onSubmit={submit} className="grid gap-3 rounded-2xl border bg-white/85 p-5 shadow-sm md:grid-cols-4"><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Supplier name" required/><Input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone"/><Input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email"/><Button disabled={create.isPending}>{create.isPending?"Saving...":"Add supplier"}</Button></form>
  <div className="overflow-x-auto rounded-2xl border bg-white/85 shadow-sm"><table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase tracking-wider text-stone-500"><th className="p-4">Supplier</th><th className="p-4">Phone</th><th className="p-4">Email</th><th className="p-4">Status</th></tr></thead><tbody>{(q.data??[]).map(s=><tr key={s.id} className="border-b last:border-0"><td className="p-4 font-bold">{s.name}</td><td className="p-4">{s.phone||"—"}</td><td className="p-4">{s.email||"—"}</td><td className="p-4">{s.isActive?"Active":"Inactive"}</td></tr>)}</tbody></table></div>
 </InventoryResourceShell>
}
