"use client"

import * as React from "react"
import { ScrollText } from "lucide-react"

import { useAuth } from "@/lib/auth/auth-context"
import {
 useAuditFacets,
 useAuditLog,
 type AuditLogEntry,
} from "@/lib/hooks/use-audit-log"
import { DataState } from "@/components/shared/data-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select"

const ALL = "__all__"
const PAGE_SIZE = 20

/** Destructive actions read differently from ordinary edits when someone
 * is scanning a page of them for what went wrong. */
function actionTone(action: string): "default" | "secondary" | "destructive" {
 if (/delete|revoke|cancel|suspend|disable/i.test(action)) return "destructive"
 if (/create|assign|approve/i.test(action)) return "default"
 return "secondary"
}

function humanise(value: string) {
 return value.replaceAll("_", " ")
}

function EntryDialog({ entry }: { entry: AuditLogEntry }) {
 const [open, setOpen] = React.useState(false)
 // Fetched with the snapshots only when someone opens one: the list ships
 // without them, because a timeline that shows neither should not carry
 // two JSON blobs per row on every request.
 const detail = useAuditLog(
  { resource: entry.resource, resourceId: entry.resourceId ?? undefined, pageSize: 50, withState: true },
  open && Boolean(entry.resourceId),
 )
 const full = detail.data?.items.find((row) => row.id === entry.id)

 return (
  <>
   <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
    Detail
   </Button>
   <Dialog open={open} onOpenChange={setOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>
       {humanise(entry.action)} · {humanise(entry.resource)}
      </DialogTitle>
      <DialogDescription>
       {entry.actorName ?? "A deleted account"} · {new Date(entry.createdAt).toLocaleString()}
      </DialogDescription>
     </DialogHeader>
     <div className="grid gap-3">
      <dl className="grid grid-cols-2 gap-2 text-xs">
       {([
        ["Record", entry.resourceId ?? "—"],
        ["Actor", entry.actorEmail ?? "—"],
        ["IP", entry.ipAddress ?? "—"],
        ["Request", entry.requestId ?? "—"],
       ] as const).map(([label, value]) => (
        <div key={label} className="rounded-lg border border-border px-3 py-2">
         <dt className="font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
         <dd className="mt-0.5 break-all font-mono">{value}</dd>
        </div>
       ))}
      </dl>
      {!entry.resourceId ? (
       <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        This entry records no specific record, so there is no before or after to show.
       </p>
      ) : detail.isPending ? (
       <p className="text-sm text-muted-foreground">Loading the change...</p>
      ) : (
       <div className="grid gap-3 sm:grid-cols-2">
        <div>
         <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Before</p>
         <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 p-3 text-xs leading-5">
          {full?.beforeState ? JSON.stringify(full.beforeState, null, 2) : "—"}
         </pre>
        </div>
        <div>
         <p className="mb-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">After</p>
         <pre className="max-h-64 overflow-auto rounded-lg bg-muted/60 p-3 text-xs leading-5">
          {full?.afterState ? JSON.stringify(full.afterState, null, 2) : "—"}
         </pre>
        </div>
       </div>
      )}
     </div>
    </DialogContent>
   </Dialog>
  </>
 )
}

/**
 * Who changed what.
 *
 * `audit.read` sat in the permission catalogue with no endpoint behind it
 * while every mutating handler wrote rows -- so the trail existed, grew,
 * and could not be read by the people it was kept for.
 */
export function AuditLogPanel() {
 const { hasPermission } = useAuth()
 const canRead = hasPermission("audit.read")
 const [resource, setResource] = React.useState(ALL)
 const [action, setAction] = React.useState(ALL)
 const [page, setPage] = React.useState(1)

 const facets = useAuditFacets(canRead)
 const logs = useAuditLog(
  {
   page,
   pageSize: PAGE_SIZE,
   ...(resource === ALL ? {} : { resource }),
   ...(action === ALL ? {} : { action }),
  },
  canRead,
 )

 if (!canRead) return null

 const items = logs.data?.items ?? []
 const totalPages = logs.data?.totalPages ?? 1

 return (
  <div className="flex flex-col gap-4">
   <div>
    <h2 className="text-lg font-semibold tracking-tight">Audit log</h2>
    <p className="mt-1 text-sm text-muted-foreground">
     Every change made in this organization, newest first, with who made it and from where.
    </p>
   </div>

   <div className="flex flex-wrap items-end gap-3">
    <div className="grid gap-1.5">
     <Label htmlFor="audit-resource">Record type</Label>
     <Select value={resource} onValueChange={(value) => { setResource(value); setPage(1) }}>
      <SelectTrigger id="audit-resource" className="w-48"><SelectValue /></SelectTrigger>
      <SelectContent>
       <SelectItem value={ALL}>Everything</SelectItem>
       {(facets.data?.resources ?? []).map((row) => (
        <SelectItem key={row.value} value={row.value}>
         {humanise(row.value)} ({row.count})
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>
    <div className="grid gap-1.5">
     <Label htmlFor="audit-action">Action</Label>
     <Select value={action} onValueChange={(value) => { setAction(value); setPage(1) }}>
      <SelectTrigger id="audit-action" className="w-48"><SelectValue /></SelectTrigger>
      <SelectContent>
       <SelectItem value={ALL}>Any action</SelectItem>
       {(facets.data?.actions ?? []).map((row) => (
        <SelectItem key={row.value} value={row.value}>
         {humanise(row.value)} ({row.count})
        </SelectItem>
       ))}
      </SelectContent>
     </Select>
    </div>
   </div>

   <DataState
    isLoading={logs.isPending}
    isError={logs.isError}
    onRetry={() => void logs.refetch()}
    errorMessage="The audit log could not be loaded."
    isEmpty={items.length === 0}
    emptyIcon={ScrollText}
    emptyTitle="Nothing recorded yet"
    emptyDescription="Changes to members, staff, payments and settings appear here as they happen."
    skeletonRows={6}
   >
    <div className="grid gap-2">
     {items.map((entry) => (
      <div key={entry.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
       <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
         <Badge variant={actionTone(entry.action)}>{humanise(entry.action)}</Badge>
         <span className="truncate text-sm font-bold">{humanise(entry.resource)}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">
         {/* An actor can be null: deleting a staff account nulls the
             actor rather than removing what they did. */}
         {entry.actorName ?? "A deleted account"}
         {entry.ipAddress ? ` · ${entry.ipAddress}` : ""} ·{" "}
         {new Date(entry.createdAt).toLocaleString()}
        </p>
       </div>
       <EntryDialog entry={entry} />
      </div>
     ))}
    </div>
   </DataState>

   {totalPages > 1 && (
    <div className="flex items-center justify-between">
     <p className="text-xs text-muted-foreground tabular-nums">Page {page} of {totalPages}</p>
     <div className="flex gap-2">
      <Button type="button" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
      <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
     </div>
    </div>
   )}
  </div>
 )
}
