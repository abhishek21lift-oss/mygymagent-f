"use client"

import * as React from "react"
import { Megaphone } from "lucide-react"
import { toast } from "sonner"
import { DataState } from "@/components/shared/data-state"
import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth/auth-context"
import { ApiError } from "@/lib/api/client"
import { useBroadcast, useBroadcasts, useCancelBroadcast, useCreateBroadcast, type Broadcast } from "@/lib/hooks/use-broadcasts"
import { useSegments } from "@/lib/hooks/use-member-intelligence"

/**
 * Segment broadcast: one message to many members, now or scheduled.
 * Delivery reuses the paced wa-send queue, so a big segment trickles
 * out over hours -- progress below is the control panel, cancel stops
 * whatever has not gone yet.
 */
export default function BroadcastsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission("whatsapp.manage")
  const segmentsQuery = useSegments(canManage)
  const list = useBroadcasts()
  const create = useCreateBroadcast()
  const cancel = useCancelBroadcast()
  const [segmentId, setSegmentId] = React.useState("")
  const [text, setText] = React.useState("")
  const [sendAt, setSendAt] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [watchId, setWatchId] = React.useState<string | null>(null)
  const watched = useBroadcast(watchId)

  if (!hasPermission("whatsapp.read")) {
    return (
      <div className="flex flex-col gap-5 pb-4">
        <h1 className="text-3xl font-semibold text-stone-950">Broadcasts</h1>
        <ErrorState message="You need whatsapp.read permission to view broadcasts." />
      </div>
    )
  }

  async function handleCreate() {
    setError(null)
    try {
      const row = await create.mutateAsync({
        segmentId,
        text: text.trim(),
        ...(sendAt ? { sendAt: new Date(sendAt).toISOString() } : {}),
      })
      setWatchId(row.id)
      setText("")
      setSendAt("")
      toast.success(sendAt ? "Broadcast scheduled" : "Broadcast sending")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create broadcast.")
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-4">
      <PageHero id="broadcasts-title" icon={Megaphone} title="Broadcasts" />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>New broadcast</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="bcast-segment">Segment</Label>
            <select
              id="bcast-segment"
              value={segmentId}
              onChange={(e) => setSegmentId(e.target.value)}
              disabled={!canManage || segmentsQuery.isPending}
              className="min-h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm dark:border-stone-700 dark:bg-stone-900"
            >
              <option value="">Choose a segment…</option>
              {(segmentsQuery.data ?? []).map((s) => (
                <option key={s.segment.id} value={s.segment.id}>
                  {s.segment.name} ({s.memberCount})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bcast-text">Message</Label>
            <Textarea
              id="bcast-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!canManage}
              rows={3}
              placeholder="Fees are due this week…"
              className="min-h-11 rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bcast-at">Send at (empty = now)</Label>
            <Input
              id="bcast-at"
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              disabled={!canManage}
              className="min-h-11 rounded-xl"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}
          <Button
            onClick={handleCreate}
            disabled={!canManage || create.isPending || !segmentId || text.trim().length === 0}
            className="min-h-11 rounded-lg"
          >
            {create.isPending ? "Creating…" : sendAt ? "Schedule broadcast" : "Send now"}
          </Button>
          {!canManage && <p className="text-xs text-stone-500">You need whatsapp.manage to send.</p>}
        </CardContent>
      </Card>

      {watched.data && <ProgressCard broadcast={watched.data} onCancel={(id) => cancel.mutate(id)} />}

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataState
            isLoading={list.isPending}
            isError={list.isError}
            onRetry={() => void list.refetch()}
            errorMessage="Could not load broadcasts."
            isEmpty={(list.data ?? []).length === 0}
            emptyIcon={Megaphone}
            emptyTitle="No broadcasts yet"
            emptyDescription="Send your first segment broadcast above."
            skeletonRows={3}
          >
            <ul className="flex flex-col gap-2">
              {(list.data ?? []).map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 p-3 dark:border-stone-700">
                  <Badge className="rounded-full">{b.status}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm">{b.body}</span>
                  <span className="text-xs text-stone-500 tabular-nums">
                    {b.sent}/{b.total} sent{b.failed > 0 && `, ${b.failed} failed`}{b.skipped > 0 && `, ${b.skipped} skipped`}
                  </span>
                  <Button type="button" size="sm" variant="outline" onClick={() => setWatchId(b.id)} className="min-h-11">
                    Watch
                  </Button>
                </li>
              ))}
            </ul>
          </DataState>
        </CardContent>
      </Card>
    </div>
  )
}

function ProgressCard({ broadcast: b, onCancel }: { broadcast: Broadcast; onCancel: (id: string) => void }) {
  const done = b.sent + b.failed + b.skipped
  const pct = b.total > 0 ? Math.round((done / b.total) * 100) : 0
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Progress — {pct}%</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Broadcast progress" className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-sm text-stone-600 dark:text-stone-400 tabular-nums">
          {b.sent}/{b.total} sent{b.failed > 0 && `, ${b.failed} failed`}{b.skipped > 0 && `, ${b.skipped} skipped`}
        </p>
        {(b.status === "PENDING" || b.status === "SENDING") && (
          <Button type="button" size="sm" variant="outline" onClick={() => onCancel(b.id)} className="min-h-11 self-start">
            Cancel broadcast
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
