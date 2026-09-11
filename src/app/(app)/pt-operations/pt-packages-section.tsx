"use client"

import * as React from "react"
import Link from "next/link"
import { Package, Plus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MemberPicker } from "@/components/shared/member-picker"
import { useBranches } from "@/lib/hooks/use-branches"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import { useCreatePtPackage, usePtPackages } from "@/lib/hooks/use-pt-packages"

function SellPackageDialog() {
  const [open, setOpen] = React.useState(false)
  const [member, setMember] = React.useState<{ id: string; label: string } | null>(null)
  const create = useCreatePtPackage()
  const branches = useBranches()
  const defaultBranch = branches.data?.items?.[0]?.id ?? ""
  const [branchId, setBranchId] = React.useState(defaultBranch)
  const [name, setName] = React.useState("10-Session PT Pack")
  const [sessions, setSessions] = React.useState("10")
  const [price, setPrice] = React.useState("")
  const [validityDays, setValidityDays] = React.useState("90")

  async function submit() {
    if (!member) { toast.error("Select a member first"); return }
    const totalSessions = Number(sessions)
    const amount = Number(price)
    const days = Number(validityDays)
    if (!Number.isFinite(totalSessions) || totalSessions < 1) { toast.error("Enter valid session count"); return }
    if (!Number.isFinite(amount) || amount < 0) { toast.error("Enter a valid price"); return }
    if (!branchId) { toast.error("No branch available"); return }
    const start = new Date()
    const end = new Date(start.getTime() + (Number.isFinite(days) && days > 0 ? days : 90) * 24 * 60 * 60 * 1000)
    try {
      await create.mutateAsync({
        memberId: member.id,
        branchId,
        name,
        totalSessions,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        price: amount,
      })
      toast.success(`Package sold to ${member.label}`)
      setOpen(false)
      setMember(null)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to sell package")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl"><Plus className="size-4" /> Sell package</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Sell a PT package</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <div><p className="mb-1.5 text-sm font-medium">Member</p><MemberPicker value={member} onChange={setMember} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Package name</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Sessions</Label><Input className="mt-1.5" type="number" value={sessions} onChange={(e) => setSessions(e.target.value)} /></div>
            <div><Label>Price</Label><Input className="mt-1.5" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Validity (days)</Label><Input className="mt-1.5" type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={create.isPending}>{create.isPending ? "Selling..." : "Sell package"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PtPackagesSection() {
  const { hasPermission } = useAuth()
  const packages = usePtPackages()

  if (!hasPermission("pt-packages.read")) return null
  const items = packages.data ?? []
  const active = items.filter((p) => p.status === "ACTIVE")

  return (
    <Card className="overflow-hidden border-white/90 bg-white/88 shadow-xl shadow-violet-900/5 backdrop-blur-xl">
      <CardHeader className="border-b border-stone-100/80 bg-gradient-to-r from-white via-amber-50/40 to-orange-50/50 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-3 font-serif text-xl text-stone-950">
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 text-orange-700"><Package className="size-4" /></span>
              PT packages
            </CardTitle>
            <p className="mt-1 text-xs font-medium text-stone-500">{active.length} active packages · session allowances with consumption tracking.</p>
          </div>
          {hasPermission("pt-packages.create") && <SellPackageDialog />}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        {packages.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">Unable to load PT packages.</div>
        ) : packages.isLoading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-stone-100" />
        ) : items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/70 p-8 text-center text-sm font-medium text-stone-500">No PT packages sold yet. Sell the first pack to start tracking session allowances.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.slice(0, 8).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200/70 bg-white/70 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-500">{p.remainingSessions} of {p.totalSessions} sessions left · ends {new Date(p.endDate).toLocaleDateString()}</p>
                </div>
                <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge>
                <Button asChild variant="ghost" size="sm"><Link href="/members">Client</Link></Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
