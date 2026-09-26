"use client"

import * as React from "react"
import { Building2, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { ApiError } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import {
 usePlatformOrganization,
 usePlatformOrganizations,
 useUpdatePlatformOrganizationStatus,
 type OrganizationStatus,
 type PlatformOrganization,
} from "@/lib/hooks/use-platform"
import { ConfirmAction } from "@/components/shared/confirm-action"
import { DataState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const STATUSES: OrganizationStatus[] = ["TRIAL", "ACTIVE", "SUSPENDED", "CANCELLED"]
const ALL = "__all__"

const STATUS_VARIANT: Record<OrganizationStatus, "default" | "secondary" | "destructive" | "outline"> = {
 TRIAL: "secondary",
 ACTIVE: "default",
 SUSPENDED: "destructive",
 CANCELLED: "outline",
}

/** What suspending or cancelling actually does to the gym on the other
 * end, said before it happens. */
const STATUS_CONSEQUENCE: Record<OrganizationStatus, string> = {
 TRIAL: "Back to trial. The organization keeps working; only its billing standing changes.",
 ACTIVE: "Restored to active. Everyone can sign in and work normally again.",
 SUSPENDED: "Their staff keep their accounts but the organization is marked suspended. Use this for non-payment, not for a support question.",
 CANCELLED: "Marked cancelled. This is the end state for an organization that has left.",
}

function OrgDetailDialog({ org }: { org: PlatformOrganization }) {
 const [open, setOpen] = React.useState(false)
 return (
  <>
   <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
    Details
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-lg">
     <DialogHeader>
      <DialogTitle>{org.name}</DialogTitle>
      <DialogDescription>{org.slug}</DialogDescription>
     </DialogHeader>
     {open ? <OrgDetailBody orgId={org.id} /> : null}
    </DialogContent>
   </Dialog>
  </>
 )
}

function OrgDetailBody({ orgId }: { orgId: string }) {
 const detail = usePlatformOrganization(orgId)
 if (detail.isPending) return <div className="grid gap-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-24 w-full" /></div>
 if (detail.isError || !detail.data) {
  return (
   <div className="grid gap-3">
    <p role="alert" className="text-sm font-semibold text-destructive">Could not load this organization.</p>
    <Button type="button" variant="outline" onClick={() => void detail.refetch()}>Try again</Button>
   </div>
  )
 }
 const org = detail.data
 return (
  <div className="grid gap-4">
   <div className="grid grid-cols-3 gap-2">
    <div className="rounded-lg border border-border px-3 py-2">
     <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Branches</p>
     <p className="text-lg font-bold tabular-nums">{org.branches.length}</p>
    </div>
    <div className="rounded-lg border border-border px-3 py-2">
     <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Staff</p>
     <p className="text-lg font-bold tabular-nums">{org._count.users}</p>
    </div>
    <div className="rounded-lg border border-border px-3 py-2">
     <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Members</p>
     <p className="text-lg font-bold tabular-nums">{org._count.members}</p>
    </div>
   </div>
   <div className="grid gap-1.5">
    <p className="text-sm font-bold">Branches</p>
    {org.branches.length === 0 ? (
     <p className="rounded-lg bg-muted/50 p-3 text-xs font-medium text-muted-foreground">No branches.</p>
    ) : (
     org.branches.map((branch) => (
      <div key={branch.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
       <span className="truncate text-sm font-bold">{branch.name}</span>
       <span className="shrink-0 text-xs text-muted-foreground">{branch.city ?? branch.slug}</span>
      </div>
     ))
    )}
   </div>
   <p className="text-xs text-muted-foreground">
    {org.timezone} · {org.currency} · since {new Date(org.createdAt).toLocaleDateString()}
   </p>
  </div>
 )
}

function StatusControl({ org }: { org: PlatformOrganization }) {
 const update = useUpdatePlatformOrganizationStatus()
 const [next, setNext] = React.useState<OrganizationStatus | "">("")

 return (
  <div className="flex items-center gap-2">
   <Select value={next} onValueChange={(value) => setNext(value as OrganizationStatus)}>
    <SelectTrigger className="h-9 w-36" aria-label={`Change status for ${org.name}`}>
     <SelectValue placeholder="Change to..." />
    </SelectTrigger>
    <SelectContent>
     {STATUSES.filter((status) => status !== org.status).map((status) => (
      <SelectItem key={status} value={status}>{status}</SelectItem>
     ))}
    </SelectContent>
   </Select>
   {next && (
    <ConfirmAction
     label="Apply"
     title={`Move ${org.name} to ${next}?`}
     description={STATUS_CONSEQUENCE[next]}
     confirmLabel={`Set ${next}`}
     pendingLabel="Applying..."
     successMessage={`${org.name} is now ${next}`}
     errorMessage="Could not change this organization's status."
     onConfirm={async () => {
      await update.mutateAsync({ id: org.id, status: next })
      setNext("")
     }}
    />
   )}
  </div>
 )
}

export default function PlatformOrganizationsPage() {
 const { user, isLoading } = useAuth()
 const [status, setStatus] = React.useState<string>(ALL)
 const [search, setSearch] = React.useState("")
 const [page, setPage] = React.useState(1)

 const isPlatformStaff = Boolean(user?.platformRole)
 const organizations = usePlatformOrganizations({
  page,
  pageSize: 20,
  ...(status === ALL ? {} : { status: status as OrganizationStatus }),
  ...(search.trim() ? { search: search.trim() } : {}),
 })

 if (isLoading) return <div className="p-8"><Skeleton className="h-40 w-full" /></div>

 // The server refuses these routes to anyone without a platformRole; this
 // is so the page says why rather than filling with 403s.
 if (!isPlatformStaff) {
  return (
   <div className="p-8">
    <Card>
     <CardContent className="flex items-start gap-3 p-8">
      <ShieldAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
       <p className="font-bold">Platform staff only</p>
       <p className="text-sm text-muted-foreground">
        This screen administers every organization on the platform, not the one you are signed in to.
       </p>
      </div>
     </CardContent>
    </Card>
   </div>
  )
 }

 const items = organizations.data?.items ?? []

 return (
  <div className="flex flex-col gap-4 pb-4">
   <PageHero
    id="platform-orgs-title"
    icon={Building2}
    title="Organizations"
    description="Every gym on the platform"
   />

   <div className="flex flex-wrap items-end gap-3">
    <div className="grid gap-1.5">
     <Label htmlFor="org-search">Search</Label>
     <Input
      id="org-search"
      className="w-64"
      value={search}
      onChange={(event) => { setSearch(event.target.value); setPage(1) }}
      placeholder="Name or slug"
     />
    </div>
    <div className="grid gap-1.5">
     <Label htmlFor="org-status">Status</Label>
     <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1) }}>
      <SelectTrigger id="org-status" className="w-40"><SelectValue /></SelectTrigger>
      <SelectContent>
       <SelectItem value={ALL}>All statuses</SelectItem>
       {STATUSES.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
      </SelectContent>
     </Select>
    </div>
   </div>

   <DataState
    isLoading={organizations.isPending}
    isError={organizations.isError}
    onRetry={() => void organizations.refetch()}
    errorMessage="Organizations could not be loaded."
    isEmpty={items.length === 0}
    emptyIcon={Building2}
    emptyTitle="No organizations match"
    emptyDescription="Try a different status or search term."
    skeletonRows={6}
   >
    <div className="grid gap-2">
     {items.map((org) => (
      <div key={org.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
       <div className="min-w-0">
        <div className="flex items-center gap-2">
         <p className="truncate font-bold">{org.name}</p>
         <Badge variant={STATUS_VARIANT[org.status]}>{org.status}</Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground tabular-nums">
         {org.slug} · {org._count.branches} branch{org._count.branches === 1 ? "" : "es"} ·{" "}
         {org._count.users} staff · {org._count.members} members
        </p>
       </div>
       <div className="flex flex-wrap items-center gap-2">
        <OrgDetailDialog org={org} />
        <StatusControl org={org} />
       </div>
      </div>
     ))}
    </div>
   </DataState>

   {(organizations.data?.total ?? 0) > items.length && (
    <div className="flex items-center justify-between">
     <p className="text-xs text-muted-foreground tabular-nums">
      Page {page} of {Math.ceil((organizations.data?.total ?? 0) / 20)}
     </p>
     <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
       Previous
      </Button>
      <Button
       type="button"
       variant="outline"
       size="sm"
       disabled={page >= Math.ceil((organizations.data?.total ?? 0) / 20)}
       onClick={() => setPage((p) => p + 1)}
      >
       Next
      </Button>
     </div>
    </div>
   )}
  </div>
 )
}
