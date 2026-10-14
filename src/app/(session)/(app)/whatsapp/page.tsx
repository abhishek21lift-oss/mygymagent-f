"use client"

import * as React from "react"
import Link from "next/link"
import { Bot, FileText, MessageCircle, Plus, QrCode, Send, Wifi, WifiOff, Zap } from "lucide-react"
import { ErrorState } from "@/components/shared/error-state"
import { PageHero } from "@/components/shared/page-hero"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "@/lib/auth/auth-context"
import { api } from "@/lib/api/client"
import { useAutoReplies, type AutoReplyRule } from "@/lib/hooks/use-auto-replies"
import { useWhatsAppContacts, useWhatsAppIntegration, type WhatsAppContact } from "@/lib/hooks/use-whatsapp"
import {
  useWhatsAppAdapterAutoReplies,
  useWhatsAppAdapterContacts,
  useWhatsAppAdapterGroups,
  useWhatsAppAdapterStatus,
  type WhatsAppAdapterContact,
  type WhatsAppAdapterGroup,
  type WhatsAppAdapterStatus,
} from "@/lib/hooks/use-whatsapp-adapter"
import type { WhatsAppIntegration } from "@/lib/types/whatsapp"

interface SessionRow {
  key: string
  name: string
  detail: string | null
  status: string
  href: string
}

function statusTone(status: string): string {
  if (status === "CONNECTED") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  if (status === "PAIRING") return "bg-amber-500/10 text-amber-800 dark:text-amber-200"
  if (status === "DISCONNECTED" || status === "ERROR" || status === "LOGGED_OUT")
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300"
  return "bg-muted text-muted-foreground"
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: string
}) {
  return (
    <Card className="overflow-hidden border-border bg-card dark:bg-card">
      <CardContent className="flex items-center gap-4 p-5">
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-lg ${tone}`}>
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold tabular-nums text-stone-950 dark:text-stone-50">{value}</p>
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

const QUICK_ACTIONS = [
  { href: "/inbox", icon: <Send className="size-5" aria-hidden="true" />, title: "New message", hint: "Reply to members", tone: "bg-emerald-500" },
  { href: "/broadcasts", icon: <Plus className="size-5" aria-hidden="true" />, title: "Broadcast", hint: "Send a campaign", tone: "bg-sky-500" },
  { href: "/whatsapp/auto-reply", icon: <Bot className="size-5" aria-hidden="true" />, title: "Auto-replies", hint: "Keyword bot rules", tone: "bg-amber-500" },
  { href: "/settings/messages", icon: <FileText className="size-5" aria-hidden="true" />, title: "Templates", hint: "Approved messages", tone: "bg-violet-500" },
]

function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {QUICK_ACTIONS.map((a) => (
        <Link key={a.href + a.title} href={a.href}>
          <Card className="overflow-hidden border-border bg-card transition hover:-translate-y-0.5 dark:bg-card">
            <CardContent className="flex items-center gap-4 p-5">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg text-white shadow-lg ${a.tone}`}>
                {a.icon}
              </span>
              <div>
                <p className="text-sm font-bold text-stone-950 dark:text-stone-50">{a.title}</p>
                <p className="text-xs font-medium text-stone-600 dark:text-stone-400">{a.hint}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function SessionsList({ sessions }: { sessions: SessionRow[] }) {
  if (sessions.length === 0) {
    return (
      <Card className="border-dashed border-border bg-card dark:bg-card">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <QrCode className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm font-bold text-stone-950 dark:text-stone-50">No sessions yet</p>
          <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
            Connect your number to start sending and receiving.
          </p>
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link href="/whatsapp/sessions">Connect WhatsApp</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sessions.map((s) => (
        <Link key={s.key} href={s.href}>
          <Card className="overflow-hidden border-border bg-card transition hover:-translate-y-0.5 dark:bg-card">
            <CardContent className="space-y-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-stone-950 dark:text-stone-50">{s.name}</p>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone(s.status)}`}>
                  {s.status.replace("_", " ")}
                </span>
              </div>
              {s.detail ? (
                <p className="font-mono text-xs text-stone-600 dark:text-stone-400">{s.detail}</p>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

/** Profile picture for one contact, falling back to the initial.
 * One cached query per JID; the backend live-fetches and answers null
 * when there is no picture. */
function ContactAvatar({ jid, name }: { jid: string; name: string }) {
  const picture = useQuery({
    queryKey: ["whatsapp", "contact-picture", jid],
    queryFn: () =>
      api.get<{ url: string | null }>(
        `/whatsapp/contacts/${encodeURIComponent(jid)}/picture`,
      ),
  })
  const url = picture.data?.url ?? null
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element -- remote per-contact URL; nothing for next/image to optimise
    return <img src={url} alt="" aria-hidden="true" className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border/60" />
  }
  return (
    <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function OverviewBody({
  sessions,
  rules,
  pending,
  failed,
  onRetry,
  contacts,
  contactsPending,
  contactsFailed,
  onContactsRetry,
  search,
  onSearch,
  groups,
  groupsPending,
  groupsFailed,
  onGroupsRetry,
}: {
  sessions: SessionRow[]
  rules: AutoReplyRule[]
  pending: boolean
  failed: boolean
  onRetry: () => void
  contacts: (WhatsAppContact | WhatsAppAdapterContact)[]
  contactsPending: boolean
  contactsFailed: boolean
  onContactsRetry: () => void
  search: string | null
  onSearch: ((value: string) => void) | null
  groups: { available: boolean; groups: WhatsAppAdapterGroup[] } | null
  groupsPending: boolean
  groupsFailed: boolean
  onGroupsRetry: () => void
}) {
  const connected = sessions.filter((s) => s.status === "CONNECTED").length
  if (pending) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }
  if (failed) {
    return <ErrorState message="Could not load WhatsApp overview." onRetry={onRetry} />
  }
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<QrCode className="size-5" aria-hidden="true" />} label="Sessions" value={sessions.length} tone="bg-sky-500" />
        <StatCard icon={<Wifi className="size-5" aria-hidden="true" />} label="Connected" value={connected} tone="bg-emerald-500" />
        <StatCard icon={<WifiOff className="size-5" aria-hidden="true" />} label="Disconnected" value={sessions.length - connected} tone="bg-rose-500" />
        <StatCard icon={<Zap className="size-5" aria-hidden="true" />} label="Auto-reply rules" value={rules.length} tone="bg-amber-500" />
      </div>
      <QuickActions />
      <SessionsList sessions={sessions} />
      <Card id="contacts" className="overflow-hidden border-border bg-card dark:bg-card scroll-mt-24">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">
            Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 sm:p-6">
          {onSearch ? (
            <Input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search by name or number"
              maxLength={100}
              className="min-h-11 max-w-sm rounded-xl"
              aria-label="Search contacts"
            />
          ) : null}
          {contactsPending ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : contactsFailed ? (
            <ErrorState message="Could not load contacts." onRetry={onContactsRetry} />
          ) : contacts.length === 0 ? (
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
              No contacts synced yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {contacts.slice(0, 10).map((c) => (
                <li key={c.jid} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <ContactAvatar jid={c.jid} name={c.name ?? c.notify ?? c.jid} />
                    <span className="truncate text-sm font-bold text-stone-950 dark:text-stone-50">
                      {c.name ?? c.notify ?? c.jid}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-stone-600 dark:text-stone-400">{c.jid}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {groups ? (
        <Card id="groups" className="overflow-hidden border-border bg-card dark:bg-card scroll-mt-24">
          <CardHeader className="border-b border-border bg-muted/40">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">
              Groups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 sm:p-6">
            {groupsPending ? (
              <Skeleton className="h-24 w-full rounded-xl" />
            ) : groupsFailed ? (
              <ErrorState message="Could not load groups." onRetry={onGroupsRetry} />
            ) : !groups.available ? (
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                Connect WhatsApp to see your groups.
              </p>
            ) : groups.groups.length === 0 ? (
              <p className="text-sm font-medium text-stone-600 dark:text-stone-400">
                No groups found.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {groups.groups.map((g) => (
                  <li key={g.jid} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm font-bold text-stone-950 dark:text-stone-50">
                      {g.subject}
                    </span>
                    <span className="text-xs font-medium text-stone-600 dark:text-stone-400 tabular-nums">
                      {g.participantCount} members
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function metaSession(integration: WhatsAppIntegration | null | undefined): SessionRow | null {
  if (!integration) return null
  return {
    key: "meta",
    name: integration.displayName ?? "WhatsApp Business",
    detail: integration.displayPhoneNumber,
    status: integration.status,
    href: "/whatsapp/sessions",
  }
}

function adapterSession(status: WhatsAppAdapterStatus | undefined): SessionRow | null {
  if (!status || !status.id) return null
  return {
    key: "adapter",
    name: "Direct session",
    detail: status.displayPhoneNumber ?? status.phoneNumber,
    status: status.status,
    href: "/whatsapp/sessions",
  }
}

function LegacyOverview() {
  const integrationQuery = useWhatsAppIntegration()
  const rulesQuery = useAutoReplies()
  const contactsQuery = useWhatsAppContacts()
  const sessions = [metaSession(integrationQuery.data)].filter((s): s is SessionRow => s !== null)
  return (
    <OverviewBody
      sessions={sessions}
      rules={rulesQuery.data ?? []}
      pending={integrationQuery.isPending || rulesQuery.isPending}
      failed={integrationQuery.isError || rulesQuery.isError}
      onRetry={() => {
        void integrationQuery.refetch()
        void rulesQuery.refetch()
      }}
      contacts={contactsQuery.data ?? []}
      contactsPending={contactsQuery.isPending}
      contactsFailed={contactsQuery.isError}
      onContactsRetry={() => void contactsQuery.refetch()}
      search={null}
      onSearch={null}
      groups={null}
      groupsPending={false}
      groupsFailed={false}
      onGroupsRetry={() => undefined}
    />
  )
}

function AdapterOverview() {
  const integrationQuery = useWhatsAppIntegration()
  const statusQuery = useWhatsAppAdapterStatus()
  const rulesQuery = useWhatsAppAdapterAutoReplies()
  const groupsQuery = useWhatsAppAdapterGroups()
  const [search, setSearch] = React.useState("")
  // Debounce the input so intermediate keystrokes never fire requests; the
  // trimmed value keys the query, so a stale response can never overwrite a
  // newer one.
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])
  const contactsQuery = useWhatsAppAdapterContacts(debouncedSearch)
  const sessions = [metaSession(integrationQuery.data), adapterSession(statusQuery.data)].filter(
    (s): s is SessionRow => s !== null,
  )
  return (
    <OverviewBody
      sessions={sessions}
      rules={rulesQuery.data ?? []}
      pending={integrationQuery.isPending || statusQuery.isPending || rulesQuery.isPending}
      failed={integrationQuery.isError || statusQuery.isError || rulesQuery.isError}
      onRetry={() => {
        void integrationQuery.refetch()
        void statusQuery.refetch()
        void rulesQuery.refetch()
      }}
      contacts={contactsQuery.data ?? []}
      contactsPending={contactsQuery.isPending}
      contactsFailed={contactsQuery.isError}
      onContactsRetry={() => void contactsQuery.refetch()}
      search={search}
      onSearch={setSearch}
      groups={groupsQuery.data ?? null}
      groupsPending={groupsQuery.isPending}
      groupsFailed={groupsQuery.isError}
      onGroupsRetry={() => void groupsQuery.refetch()}
    />
  )
}

export default function WhatsAppOverviewPage() {
  const { user, hasPermission } = useAuth()
  if (!hasPermission("whatsapp.read")) {
    return (
      <Card className="overflow-hidden border-border bg-card dark:bg-card">
        <CardHeader className="border-b border-border bg-muted/40">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground tracking-tight text-stone-950 dark:text-stone-50">
            WhatsApp overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message="You need whatsapp.read permission to view WhatsApp overview." />
        </CardContent>
      </Card>
    )
  }
  return (
    <div className="space-y-6">
      <PageHero
        id="whatsapp-title"
        icon={MessageCircle}
        title="WhatsApp"
        description="Overview of your gym messaging sessions and automation."
        actions={
          <Button asChild variant="outline" size="sm" className="min-h-11">
            <Link href="/whatsapp/sessions">Manage connection</Link>
          </Button>
        }
      />
      {user?.features?.whatsappAdapter ? <AdapterOverview /> : <LegacyOverview />}
    </div>
  )
}
