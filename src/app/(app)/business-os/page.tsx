"use client"

import * as React from "react"
import { toast } from "sonner"
import { Brain, Megaphone, RefreshCw, ShieldCheck, Sparkles, Star, Tablet } from "lucide-react"

import { api } from "@/lib/api/client"
import { useAuth } from "@/lib/auth/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHero } from "@/components/shared/page-hero"
import { DataState } from "@/components/shared/data-state"
import {
  AccountingSection,
  FeedbackSection,
  ReferralsSection,
  SupportSection,
} from "./business-os-sections"
import {
  useCreatePortalInvite,
  useRevokePortalInvites,
} from "@/lib/hooks/use-business-os"

type Campaign = { id: string; name: string; channel: string; status: string; audienceFilter?: Record<string, unknown>; scheduledAt?: string | null }

/**
 * Business OS.
 *
 * Six domains -- accounting, loyalty, marketing, referrals, support and
 * feedback -- each with its own permission pair and its own tables, and
 * for a long time each with one create-only form on this page: you could
 * open a support ticket but never answer one, create a survey but never
 * read its score, record a referral and never convert it.
 *
 * It is a composition of real sections now. Support, feedback, referrals
 * and accounting each own their reads, writes and empty states; what is
 * left inline here is the handful of one-shot tools that genuinely are
 * one field and a button.
 */
export default function BusinessOsPage() {
  const { hasPermission } = useAuth()
  const [memberId, setMemberId] = React.useState("")
  const [points, setPoints] = React.useState("100")
  const [reason, setReason] = React.useState("Manual loyalty adjustment")
  const [campaign, setCampaign] = React.useState({ name: "", channel: "EMAIL", templateKey: "", audienceFilter: "{}" })
  const [aiCommand, setAiCommand] = React.useState("")
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const [output, setOutput] = React.useState<unknown>(null)
  // Starts true: before B-P0-3 the first paint showed zeroes while the
  // fetch was still in flight, which reads as "you have none of anything"
  // rather than "not loaded yet".
  const [loading, setLoading] = React.useState(true)
  // And a *failed* fetch left those same zeroes on screen, saying the
  // same untrue thing after the toast had gone.
  const [loadError, setLoadError] = React.useState(false)

  const portalInvite = useCreatePortalInvite()
  const portalRevoke = useRevokePortalInvites()

  const refresh = React.useCallback(async () => {
    setLoading(true)
    try {
      const cs = hasPermission("marketing.read")
        ? await api.get<Campaign[]>("/marketing/campaigns")
        : []
      setCampaigns(Array.isArray(cs) ? cs : [])
      setLoadError(false)
    } catch (e) {
      setLoadError(true)
      toast.error(e instanceof Error ? e.message : "Could not refresh campaigns")
    } finally {
      setLoading(false)
    }
  }, [hasPermission])

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refresh])

  const run = async (fn: () => Promise<unknown>, message?: string) => {
    try {
      const r = await fn()
      setOutput(r)
      if (message) toast.success(message)
      await refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed")
    }
  }

  const createCampaign = async () => {
    try {
      const audienceFilter = JSON.parse(campaign.audienceFilter || "{}")
      await run(
        () =>
          api.post("/marketing/campaigns", {
            name: campaign.name,
            channel: campaign.channel,
            templateKey: campaign.templateKey,
            audienceFilter,
          }),
        "Campaign created",
      )
      setCampaign({ ...campaign, name: "" })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Audience filter must be valid JSON")
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        id="business-os"
        icon={Sparkles}
        title="Business OS"
        description="Loyalty, referrals, support, feedback, marketing and the ledger."
        actions={
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <SupportSection />
      <FeedbackSection />
      <ReferralsSection />
      <AccountingSection />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Star className="size-5" /> Loyalty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>Member ID</Label>
            <Input value={memberId} onChange={(e) => setMemberId(e.target.value)} placeholder="Member UUID" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={points} onChange={(e) => setPoints(e.target.value)} type="number" aria-label="Points" />
              <Input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
            </div>
            <div className="flex flex-wrap gap-2">
              {hasPermission("loyalty.read") && (
                <Button
                  variant="outline"
                  disabled={!memberId}
                  onClick={() => void run(() => api.get("/loyalty/" + memberId), "Loyalty loaded")}
                >
                  View balance
                </Button>
              )}
              {hasPermission("loyalty.manage") && (
                <Button
                  disabled={!memberId}
                  onClick={() =>
                    void run(
                      () => api.post("/loyalty/" + memberId + "/adjust", { points: Number(points), reason }),
                      "Loyalty adjusted",
                    )
                  }
                >
                  Adjust points
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Megaphone className="size-5" /> Marketing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DataState
              isLoading={loading}
              isError={loadError}
              onRetry={() => void refresh()}
              errorMessage="Campaigns could not be loaded."
              emptyTitle="Marketing"
              skeletonRows={1}
            >
              <>
                <Input
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  placeholder="Campaign name"
                  aria-label="Campaign name"
                />
                <select
                  className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
                  value={campaign.channel}
                  onChange={(e) => setCampaign({ ...campaign, channel: e.target.value })}
                  aria-label="Channel"
                >
                  <option>EMAIL</option>
                  <option>WHATSAPP</option>
                  <option>SMS</option>
                </select>
                <Input
                  value={campaign.templateKey}
                  onChange={(e) => setCampaign({ ...campaign, templateKey: e.target.value })}
                  placeholder="Message/template"
                  aria-label="Template"
                />
                <textarea
                  className="min-h-20 w-full rounded-md border border-input bg-card p-3 text-sm"
                  value={campaign.audienceFilter}
                  onChange={(e) => setCampaign({ ...campaign, audienceFilter: e.target.value })}
                  aria-label="Audience filter JSON"
                />
                {hasPermission("marketing.manage") && (
                  <Button disabled={!campaign.name} onClick={() => void createCampaign()}>
                    Create campaign
                  </Button>
                )}
                {campaigns.length > 0 && (
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="text-xs font-medium text-muted-foreground">Campaigns</div>
                    {campaigns.slice(0, 6).map((c) => (
                      <div
                        key={c.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.channel} · {c.status}
                          </p>
                        </div>
                        {hasPermission("marketing.manage") && (
                          <div className="flex shrink-0 gap-2">
                            {/* Enrol builds the audience; run sends to it.
                                Both endpoints existed with no button. */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void run(() => api.post(`/marketing/campaigns/${c.id}/enroll`), "Audience enrolled")
                              }
                            >
                              Enrol
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => void run(() => api.post(`/marketing/campaigns/${c.id}/run`), "Campaign run")}
                            >
                              Run
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            </DataState>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Brain className="size-5" /> PT intelligence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              placeholder="Member UUID"
              aria-label="Member UUID for PT intelligence"
            />
            <Button
              disabled={!memberId}
              onClick={() => void run(() => api.get("/pt-intelligence/" + memberId), "PT intelligence loaded")}
            >
              Analyze member
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Sparkles className="size-5" /> Global AI command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              placeholder="Ask about revenue, risk, inventory…"
              aria-label="AI command"
            />
            <Button
              disabled={!aiCommand.trim()}
              onClick={() => void run(() => api.post("/global-ai/command", { command: aiCommand }), "AI command completed")}
            >
              <Sparkles className="mr-2 size-4" />
              Run command
            </Button>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <ShieldCheck className="size-5" /> Member portal &amp; kiosk
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Portal links are single-use and can be revoked. Kiosk devices are branch-bound.
            </p>
            {hasPermission("portal.manage") && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  placeholder="Member UUID"
                  aria-label="Member UUID for portal invite"
                  className="max-w-xs"
                />
                {/* Issuing and revoking a portal link were both built and
                    unreachable: a member could be invited only by someone
                    with a terminal, and a leaked link could not be pulled. */}
                <Button
                  disabled={!memberId || portalInvite.isPending}
                  onClick={() =>
                    void portalInvite
                      .mutateAsync(memberId)
                      .then((r) => {
                        setOutput(r)
                        toast.success("Portal invite created")
                      })
                      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not create the invite"))
                  }
                >
                  Invite to portal
                </Button>
                <Button
                  variant="outline"
                  disabled={!memberId || portalRevoke.isPending}
                  onClick={() =>
                    void portalRevoke
                      .mutateAsync(memberId)
                      .then(() => toast.success("Portal invites revoked"))
                      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not revoke the invites"))
                  }
                >
                  Revoke invites
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => window.open("/member-portal", "_blank")}>
                <Star className="mr-2 size-4" />
                Member portal
              </Button>
              <Button variant="outline" onClick={() => window.open("/kiosk", "_blank")}>
                <Tablet className="mr-2 size-4" />
                Kiosk
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {output !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Latest result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[420px] overflow-auto rounded-xl bg-muted p-4 text-xs">
              {JSON.stringify(output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
