"use client"

import * as React from "react"
import { Users } from "lucide-react"

import { ApiError, api } from "@/lib/api/client"
import { Button } from "@/components/ui/button"

export interface CampaignAudiencePreview {
  campaign: { id: string; name: string; channel: string; status: string }
  matched: number
  alreadyEnqueued: number
  cappedAt: number
  truncated: boolean
  sample: { id: string; name: string; email: string | null; phone: string | null }[]
}

/**
 * Who a campaign would reach, before it reaches them.
 *
 * `POST /marketing/campaigns/:id/enroll` has always existed and is
 * irreversible: it writes one row per matched member and moves the
 * campaign to QUEUED. There was no way to ask "how many, and who" first,
 * so the first honest look at an audience filter's effect was after the
 * send had gone out.
 *
 * The count comes from the same resolver `enroll` uses on the server, so
 * the number shown here is the number that gets written. A preview that
 * recomputed the audience on its own would be the one place a count
 * could disagree with the send, and a count that under-reports before
 * you commit is worse than none, because it is trusted.
 *
 * This is the panel only. The trigger is `CampaignAudienceButton` below,
 * and the page owns which campaign is open — see its comment for why the
 * two are split.
 */
export function CampaignAudiencePanel({
  campaignId,
  campaignName,
}: {
  campaignId: string
  campaignName: string
}) {
  const [preview, setPreview] = React.useState<CampaignAudiencePreview | null>(
    null,
  )
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch on open rather than on mount: a list of six campaigns would
  // otherwise fire six previews nobody asked for. The panel is only
  // mounted while open, so this runs once per open.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsPending(true)
      setError(null)
      try {
        const data = await api.get<CampaignAudiencePreview>(
          `/marketing/campaigns/${campaignId}/preview`,
        )
        if (!cancelled) setPreview(data)
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ApiError ? e.message : "Could not preview the audience",
          )
        }
      } finally {
        if (!cancelled) setIsPending(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [campaignId])

  return (
    <div className="mt-2 rounded-2xl border border-border bg-surface-sunken p-3">
      {isPending && !preview ? (
        <p className="text-xs text-muted-foreground">Counting…</p>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : preview ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-bold tabular-nums">
              {preview.matched.toLocaleString("en-IN")}
            </span>{" "}
            <span className="text-muted-foreground">
              {preview.matched === 1 ? "member matches" : "members match"}{" "}
              {campaignName}
            </span>
          </p>

          {preview.truncated ? (
            // `enroll` caps at 5,000. Saying so is the difference
            // between "this is everyone" and "this is the first
            // 5,000 and the rest never hear from you".
            <p className="rounded-xl border border-warning/30 bg-warning-tint px-3 py-2 text-xs text-warning">
              Only the first {preview.cappedAt.toLocaleString("en-IN")} will be
              enrolled. The other{" "}
              {(preview.matched - preview.cappedAt).toLocaleString("en-IN")} will
              not be sent anything.
            </p>
          ) : null}

          {preview.alreadyEnqueued > 0 ? (
            <p className="text-xs text-muted-foreground">
              {preview.alreadyEnqueued.toLocaleString("en-IN")} already enrolled.
              Enrolling again will not duplicate them.
            </p>
          ) : null}

          {preview.matched === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nobody matches this filter, so enrolling would queue nothing. Adjust
              the audience filter first.
            </p>
          ) : (
            <>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                First {preview.sample.length}
              </p>
              <ul className="flex flex-col gap-1">
                {preview.sample.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-xs"
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere] font-medium">{member.name}</span>
                    <span className="min-w-0 [overflow-wrap:anywhere] text-muted-foreground">
                      {member.email ?? member.phone ?? "no contact on file"}
                    </span>
                  </li>
                ))}
              </ul>
              {preview.matched > preview.sample.length ? (
                <p className="text-[11px] text-muted-foreground">
                  Showing {preview.sample.length} of{" "}
                  {preview.matched.toLocaleString("en-IN")}.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}

/**
 * The trigger, and nothing else.
 *
 * It deliberately renders no panel. An earlier version returned the
 * button and the panel together, and the panel carried `col-span-full` on
 * the assumption it was a child of the campaign card's grid — but the
 * component is rendered *inside* the card's `flex flex-wrap` button row,
 * where `col-span-full` means nothing. The panel became a ~520px flex
 * item beside the buttons instead of a row beneath them, so in the
 * 3-column card layout it was overlapped by the neighbouring card and
 * its text was cut mid-sentence ("4 members match Active membersh…",
 * emails truncated to "m4@i"). It also let several panels be open at
 * once, stacked over each other.
 *
 * Owning the open state in the page fixes both: the button stays inline
 * with Enrol/Run, and the panel renders as a full-width row of the card.
 */
export function CampaignAudienceButton({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  return (
    <Button size="sm" variant="outline" aria-expanded={open} onClick={onToggle}>
      <Users className="size-3.5" aria-hidden="true" />
      Audience
    </Button>
  )
}
