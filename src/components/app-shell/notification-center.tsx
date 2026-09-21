"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bell, Check, CheckCheck, ExternalLink, Settings2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "@/lib/notifications"
import { ApiError } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const notificationKey = ["notifications"]

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  const diff = Date.now() - timestamp
  if (!Number.isFinite(diff)) return ""
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString()
}

function NotificationRow({ item, onRead, onOpen }: { item: NotificationItem; onRead: (id: string) => void; onOpen: (item: NotificationItem) => void }) {
  const unread = !item.readAt
  return (
    <div className={cn("group relative border-b border-border/50 px-4 py-3.5 transition-colors last:border-b-0", unread ? "bg-primary/[0.045]" : "bg-transparent")}>
      {unread && <span aria-hidden="true" className="absolute inset-y-3 left-1 w-1 rounded-full bg-primary" />}
      <button type="button" className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onClick={() => onOpen(item)}>
        <div className="flex items-start gap-3">
          <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border", unread ? "border-primary/20 bg-primary/10 text-primary" : "border-border/60 bg-muted text-muted-foreground")}>
            <Bell className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-start justify-between gap-2">
              <span className={cn("line-clamp-2 text-sm", unread ? "font-bold text-foreground" : "font-semibold text-foreground/85")}>{item.title}</span>
              <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{formatRelativeTime(item.createdAt)}</span>
            </span>
            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">{item.body}</span>
          </span>
        </div>
      </button>
      {unread && <Button type="button" variant="ghost" size="sm" className="mt-2 ml-11 h-8 rounded-lg px-2 text-xs opacity-70 hover:opacity-100" onClick={() => onRead(item.id)}><Check className="size-3.5" aria-hidden="true" />Mark read</Button>}
    </div>
  )
}

export function NotificationCenter() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const query = useQuery({ queryKey: notificationKey, queryFn: () => getNotifications(50), staleTime: 15_000, refetchInterval: 30_000, refetchIntervalInBackground: false, retry: 1 })
  const readMutation = useMutation({ mutationFn: markNotificationRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKey }), onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to mark notification as read") })
  const readAllMutation = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKey }), onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to mark notifications as read") })
  const unreadCount = query.data?.unreadCount ?? 0
  const visibleCount = query.data?.items.length ?? 0
  function openNotification(item: NotificationItem) { if (!item.readAt) readMutation.mutate(item.id); if (item.actionUrl) { setOpen(false); router.push(item.actionUrl) } }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="relative min-h-10 min-w-10 rounded-xl border border-transparent hover:border-border/60 hover:bg-card/70" aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} title="Notifications"><Bell className="size-4" aria-hidden="true" />{unreadCount > 0 && <Badge variant="destructive" className="pointer-events-none absolute -right-0.5 -top-0.5 min-w-5 border-2 border-background px-1 py-0 text-[9px] leading-4 shadow-sm" aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</Badge>}</Button></PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[min(25rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3.5"><div><div className="text-sm font-bold tracking-tight">Notifications</div><div className="text-xs text-muted-foreground">{unreadCount > 0 ? `${unreadCount} unread` : "You&apos;re all caught up"}</div></div><div className="flex items-center gap-1"><Button variant="ghost" size="icon" className="size-9 rounded-lg" disabled={unreadCount === 0 || readAllMutation.isPending} onClick={() => readAllMutation.mutate()} aria-label="Mark all notifications as read" title="Mark all as read"><CheckCheck className="size-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" className="size-9 rounded-lg" onClick={() => { setOpen(false); router.push("/settings/notifications") }} aria-label="Notification settings" title="Notification settings"><Settings2 className="size-4" aria-hidden="true" /></Button></div></div>
        <div className="max-h-[min(32rem,65vh)] overflow-y-auto">
          {query.isPending ? <div className="space-y-3 p-4" role="status" aria-label="Loading notifications">{[1,2,3].map((item) => <div key={item} className="flex gap-3"><div className="size-8 animate-pulse rounded-xl bg-muted" /><div className="flex-1 space-y-2"><div className="h-3 w-2/3 animate-pulse rounded bg-muted" /><div className="h-3 w-full animate-pulse rounded bg-muted" /></div></div>)}</div> : query.isError ? <div className="p-6 text-center"><Bell className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" /><p className="mt-2 text-sm font-semibold">Notifications are unavailable</p><p className="mt-1 text-xs text-muted-foreground">We couldn&apos;t load your notification center.</p><Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => query.refetch()}>Try again</Button></div> : visibleCount === 0 ? <div className="p-8 text-center"><Bell className="mx-auto size-9 text-muted-foreground/40" aria-hidden="true" /><p className="mt-2 text-sm font-semibold">No notifications yet</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Important gym activity will appear here.</p></div> : query.data?.items.map((item) => <NotificationRow key={item.id} item={item} onRead={(id) => readMutation.mutate(id)} onOpen={openNotification} />)}
        </div>
        {visibleCount > 0 && <div className="border-t border-border/60 bg-muted/20 px-4 py-2 text-center"><button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" onClick={() => { setOpen(false); router.push("/settings/notifications") }}>Manage notification preferences<ExternalLink className="size-3" aria-hidden="true" /></button></div>}
      </PopoverContent>
    </Popover>
  )
}
