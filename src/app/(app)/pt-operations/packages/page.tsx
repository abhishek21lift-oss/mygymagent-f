"use client"
import * as React from "react"
import { Package, Plus } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useMembers } from "@/lib/hooks/use-members"
import { useBranches } from "@/lib/hooks/use-branches"
import { useCreatePtPackage, usePtPackages } from "@/lib/hooks/use-pt-packages"

export default function PtPackagesPage() {
  const members = useMembers({ page: 1, pageSize: 100, order: "asc" })
  const branches = useBranches({ page: 1, pageSize: 100, order: "asc" })
  const [memberId, setMemberId] = React.useState("")
  const [branchId, setBranchId] = React.useState("")
  const [name, setName] = React.useState("10 Session PT Package")
  const [sessions, setSessions] = React.useState("10")
  const [price, setPrice] = React.useState("")
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0,10))
  const [endDate, setEndDate] = React.useState(new Date(Date.now()+30*86400000).toISOString().slice(0,10))
  const packages = usePtPackages(memberId || undefined)
  const create = useCreatePtPackage()
  async function submit(e: React.FormEvent) { e.preventDefault(); if (!memberId || !branchId) return toast.error("Select client and branch"); try { await create.mutateAsync({ memberId, branchId, name, totalSessions: Number(sessions), startDate, endDate, price: Number(price || 0), currency: "USD" }); toast.success("PT package created") } catch { toast.error("Unable to create PT package") } }
  return <div className="flex flex-col gap-7"><PageHeader title="PT Packages" description="Sell and track session-based personal training packages." />
    <div className="grid gap-4 xl:grid-cols-[1fr_1.5fr]"><Card><CardHeader><CardTitle className="text-base">Create package</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="flex flex-col gap-3">
      <select value={memberId} onChange={e=>setMemberId(e.target.value)} className="h-10 rounded-xl border px-3"><option value="">Select client</option>{(members.data?.items??[]).map(m=><option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}</select>
      <select value={branchId} onChange={e=>setBranchId(e.target.value)} className="h-10 rounded-xl border px-3"><option value="">Select branch</option>{(branches.data?.items??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
      <input value={name} onChange={e=>setName(e.target.value)} className="h-10 rounded-xl border px-3" placeholder="Package name" />
      <div className="grid grid-cols-2 gap-2"><input type="number" min="1" value={sessions} onChange={e=>setSessions(e.target.value)} className="h-10 rounded-xl border px-3" placeholder="Sessions" /><input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)} className="h-10 rounded-xl border px-3" placeholder="Price" /></div>
      <div className="grid grid-cols-2 gap-2"><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="h-10 rounded-xl border px-3" /><input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="h-10 rounded-xl border px-3" /></div>
      <Button disabled={create.isPending}><Plus className="size-4" /> {create.isPending ? "Creating..." : "Create PT package"}</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Packages</CardTitle></CardHeader><CardContent><div className="flex flex-col gap-3">{packages.data?.map(p=><div key={p.id} className="flex items-center justify-between rounded-2xl border p-4"><div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted-foreground">{p.status} · {new Date(p.startDate).toLocaleDateString()} – {new Date(p.endDate).toLocaleDateString()}</p></div><div className="text-right"><p className="font-bold">{p.remainingSessions}/{p.totalSessions}</p><p className="text-xs text-muted-foreground">sessions left</p></div></div>)}{!packages.data?.length && <div className="rounded-2xl border border-dashed p-10 text-center"><Package className="mx-auto size-8 text-muted-foreground"/><p className="mt-2 font-medium">No PT packages yet</p></div>}</div></CardContent></Card></div></div>
}
