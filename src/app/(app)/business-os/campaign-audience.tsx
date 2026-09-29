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
 */
export function CampaignAudienceButton({
  campaignId,
  campaignName,
}: {
  campaignId: string
  campaignName: string
}) {
  const [open, setOpen] = React.useState(false)
  const [preview, setPreview] = React.useState<CampaignAudiencePreview | null>(null)
  const [isPending, setIsPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function load() {
    setIsPending(true)
    setError(null)
    try {
      const data = await api.get<CampaignAudiencePreview>(
        `/marketing/campaigns/${campaignId}/preview`,
      )
      setPreview(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not preview the audience")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        aria-expanded={open}
        onClick={() => {
          const next = !open
          setOpen(next)
          // Fetch on first open rather than on mount: a list of six
          // campaigns would otherwise fire six previews nobody asked for.
          if (next && !preview) void load()
        }}
      >
        <Users className="size-3.5" aria-hidden="true" />
        Audience
      </Button>

      {open ? (
        <div className="col-span-full mt-2 rounded-2xl border border-border bg-surface-sunken p-3">
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
                  Only the first {preview.cappedAt.toLocaleString("en-IN")} will
                  be enrolled. The other{" "}
                  {(preview.matched - preview.cappedAt).toLocaleString("en-IN")}{" "}
                  will not be sent anything.
                </p>
              ) : null}

              {preview.alreadyEnqueued > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {preview.alreadyEnqueued.toLocaleString("en-IN")} already
                  enrolled. Enrolling again will not duplicate them.
                </p>
              ) : null}

              {preview.matched === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nobody matches this filter, so enrolling would queue
                  nothing. Adjust the audience filter first.
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
                        <span className="truncate font-medium">{member.name}</span>
                        <span className="truncate text-muted-foreground">
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
      ) : null}
    </>
  )
}
