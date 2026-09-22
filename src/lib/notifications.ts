import { api } from "@/lib/api/client"

export interface NotificationItem {
  id: string
  organizationId: string
  userId: string
  type: string
  title: string
  body: string
  actionUrl?: string | null
  metadata?: Record<string, unknown> | null
  readAt?: string | null
  createdAt: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  unreadCount: number
  hasMore: boolean
  nextCursor: string | null
}

export interface NotificationQuery {
  limit?: number
  unreadOnly?: boolean
  type?: string
  search?: string
  cursor?: string
}

export interface NotificationPreference {
  id: string
  organizationId: string
  userId: string
  category: string
  inApp: boolean
  email: boolean
  whatsapp: boolean
  sms: boolean
  push: boolean
  updatedAt: string
  createdAt: string
}

export interface NotificationPreferenceInput {
  inApp?: boolean
  email?: boolean
  whatsapp?: boolean
  sms?: boolean
  push?: boolean
}

export function getNotifications(query: NotificationQuery = {}) {
  return api.get<NotificationListResponse>("/notifications", {
    query: {
      limit: query.limit ?? 25,
      unreadOnly: query.unreadOnly ? "true" : undefined,
      type: query.type || undefined,
      search: query.search || undefined,
      cursor: query.cursor || undefined,
    },
  })
}

export function markNotificationRead(id: string) {
  return api.patch<NotificationItem>(`/notifications/${id}/read`)
}

export function markNotificationUnread(id: string) {
  return api.patch<NotificationItem>(`/notifications/${id}/unread`)
}

export function markAllNotificationsRead() {
  return api.patch<{ updated: number }>("/notifications/read-all")
}

export function getNotificationPreferences() {
  return api.get<NotificationPreference[]>("/notifications/preferences")
}

export function updateNotificationPreference(
  category: string,
  input: NotificationPreferenceInput,
) {
  return api.patch<NotificationPreference>(
    `/notifications/preferences/${encodeURIComponent(category)}`,
    input,
  )
}
