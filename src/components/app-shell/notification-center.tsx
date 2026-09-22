"use client"

import * as React from "react"
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Bell,
  Check,
  CheckCheck,
  Circle,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  Settings2,
  UserPlus,
  CreditCard,
  CalendarCheck,
  Dumbbell,
  Package,
  MessageCircle,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
  type NotificationItem,
} from "@/lib/notifications"
import { ApiError } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const notificationKey = ["notifications"]

const filters = [
  { key: "", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "MEMBER_CREATED", label: "Members" },
  { key: "PAYMENT_RECORDED", label: "Payments" },
  { key: "LEAD_CREATED", label: "Leads" },
  { key: "PT_SESSION_BOOKED", label: "PT" },
  { key: "INVENTORY_LOW", label: "Inventory" },
  { key: "WHATSAPP_RECEIVED", label: "WhatsApp" },
] as const

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime()
  const diff = Date.now() - timestamp
  if (!Number.isFinite(diff)) return ""
  const minutes = Math.floor(Math.max(diff, 0) / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString()
}

function NotificationIcon({ type }: { type: string }) {
  if (type.includes("PAYMENT")) return <CreditCard className="size-4" aria-hidden="true" />
  if (type.includes("MEMBER")) return <UserPlus className="size-4" aria-hidden="true" />
  if (type.includes("LEAD")) return <Users className="size-4" aria-hidden="true" />
  if (type.includes("PT_SESSION") || type.includes("WORKOUT")) return <Dumbbell className="size-4" aria-hidden="true" />
  if (type.includes("INVENTORY")) return <Package className="size-4" aria-hidden="true" />
  if (type.includes("WHATSAPP")) return <MessageCircle className="size-4" aria-hidden="true" />
  if (type.includes("ATTENDANCE") || type.includes("MEMBERSHIP")) return <CalendarCheck className="size-4" aria-hidden="true" />
  return <Bell className="size-4" aria-hidden="true" />
}

function NotificationRow({
  item,
  onRead,
  onUnread,
  onOpen,
}: {
  item: NotificationItem
  onRead: (id: string) => void
  onUnread: (id: string) => void
  onOpen: (item: NotificationItem) => void
}) {
  const unread = !item.readAt
  return (
    <div
      className={cn(
        "group relative border-b border-border/50 px-4 py-3 transition-colors last:border-b-0",
        unread ? "bg-primary/[0.045]" : "bg-transparent",
      )}
    >
      {unread && <span aria-hidden="true" className="absolute inset-y-3 left-1 w-1 rounded-full bg-primary" />}
      <div className="flex items-start gap-3">
        <span className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border",
          unread ? "border-primary/20 bg-primary/10 text-primary" : "border-border/60 bg-muted text-muted-foreground",
        )}>
          <NotificationIcon type={item.type} />
        </span>
        <button
          type="button"
          className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => onOpen(item)}
        >
          <span className="flex items-start justify-between gap-2">
            <span className={cn("line-clamp-2 text-sm", unread ? "font-bold text-foreground" : "font-semibold text-foreground/85")}>
              {item.title}
            </span>
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
              {formatRelativeTime(item.createdAt)}
            </span>
          </span>
          <span className="mt-1 block line-clamp-2 text-xs leading-5 text-muted-foreground">{item.body}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0 rounded-lg opacity-60 hover:opacity-100"
          onClick={() => unread ? onRead(item.id) : onUnread(item.id)}
          aria-label={unread ? "Mark notification as read" : "Mark notification as unread"}
          title={unread ? "Mark as read" : "Mark as unread"}
        >
          {unread ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className="size-3.5" aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [filter, setFilter] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [appliedSearch, setAppliedSearch] = React.useState("")

  const unreadOnly = filter === "unread"
  const type = filter && filter !== "unread" ? filter : undefined

  const query = useInfiniteQuery({
    queryKey: [...notificationKey, { filter, appliedSearch }],
    queryFn: ({ pageParam }) =>
      getNotifications({
        limit: 25,
        unreadOnly,
        type,
        search: appliedSearch,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKey }),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to mark notification as read"),
  })
  const unreadMutation = useMutation({
    mutationFn: markNotificationUnread,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKey }),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to mark notification as unread"),
  })
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKey }),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Failed to mark notifications as read"),
  })

  const items = query.data?.pages.flatMap((page) => page.items) ?? []
  const unreadCount = query.data?.pages[0]?.unreadCount ?? 0

  function openNotification(item: NotificationItem) {
    if (!item.readAt) readMutation.mutate(item.id)
    if (item.actionUrl) {
      setOpen(false)
      router.push(item.actionUrl)
    }
  }

  function applySearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedSearch(search.trim())
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative min-h-10 min-w-10 rounded-xl border border-transparent hover:border-border/60 hover:bg-card/70"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
          title="Notifications"
        >
          <Bell className="size-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="pointer-events-none absolute -right-0.5 -top-0.5 min-w-5 border-2 border-background px-1 py-0 text-[9px] leading-4 shadow-sm"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(30rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl"
      >
        <div className="border-b border-border/60 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold tracking-tight">Notifications</div>
              <div className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-9 rounded-lg" onClick={() => query.refetch()} aria-label="Refresh notifications" title="Refresh">
                <RefreshCw className={cn("size-4", query.isFetching && "animate-spin")} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg"
                disabled={unreadCount === 0 || readAllMutation.isPending}
                onClick={() => readAllMutation.mutate()}
                aria-label="Mark all notifications as read"
                title="Mark all as read"
              >
                <CheckCheck className="size-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-lg"
                onClick={() => { setOpen(false); router.push("/settings/notifications") }}
                aria-label="Notification settings"
                title="Notification settings"
              >
                <Settings2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          <form onSubmit={applySearch} className="mt-3 flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notifications..."
                aria-label="Search notifications"
                className="h-9 rounded-xl pl-9"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-9 rounded-xl" aria-label="Apply notification search">
              Search
            </Button>
          </form>

          <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5" aria-label="Notification filters">
            <Filter className="mt-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {filters.map((item) => (
              <Button
                key={item.key}
                type="button"
                size="sm"
                variant={filter === item.key ? "default" : "ghost"}
                className="h-7 shrink-0 rounded-lg px-2.5 text-[11px]"
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="max-h-[min(34rem,60vh)] overflow-y-auto">
          {query.isPending ? (
            <div className="space-y-3 p-4" role="status" aria-label="Loading notifications">
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3">
                  <div className="size-8 animate-pulse rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <div className="p-6 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold">Notifications are unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground">We could not load your notification center.</p>
              <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => query.refetch()}>Try again</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="mx-auto size-9 text-muted-foreground/40" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold">{filter === "unread" ? "No unread notifications" : "No notifications found"}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {appliedSearch ? "Try a different search." : "Important gym activity will appear here."}
              </p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onRead={(id) => readMutation.mutate(id)}
                  onUnread={(id) => unreadMutation.mutate(id)}
                  onOpen={openNotification}
                />
              ))}
              {query.hasNextPage && (
                <div className="p-3">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl"
                    disabled={query.isFetchingNextPage}
                    onClick={() => query.fetchNextPage()}
                  >
                    {query.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 text-center">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            onClick={() => { setOpen(false); router.push("/settings/notifications") }}
          >
            Manage notification preferences
            <ExternalLink className="size-3" aria-hidden="true" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
