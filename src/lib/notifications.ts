import { api } from "@/lib/api/client"

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL"

export interface NotificationItem {
  id: string
  organizationId: string
  userId: string
  branchId?: string | null
  actorUserId?: string | null
  type: string
  category: string
  priority: NotificationPriority
  title: string
  body: string
  actionUrl?: string | null
  entityType?: string | null
  entityId?: string | null
  groupKey?: string | null
  metadata?: Record<string, unknown> | null
  readAt?: string | null
  archivedAt?: string | null
  snoozedUntil?: string | null
  expiresAt?: string | null
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
  category?: string
  priority?: NotificationPriority
  search?: string
  cursor?: string
  includeArchived?: boolean
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

/** One row of the settings grid. Served by the API rather than written
 * out here: the backend's `notification-categories.ts` is the catalog the
 * fan-out and the preference validator both read, so a category listed
 * here by hand could drift into one nothing notifies on. */
export interface NotificationCategory {
  key: string
  label: string
  description: string
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
      category: query.category || undefined,
      priority: query.priority || undefined,
      search: query.search || undefined,
      cursor: query.cursor || undefined,
      includeArchived: query.includeArchived ? "true" : undefined,
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
export function archiveNotification(id: string) {
  return api.patch<NotificationItem>(`/notifications/${id}/archive`)
}
export function unarchiveNotification(id: string) {
  return api.patch<NotificationItem>(`/notifications/${id}/unarchive`)
}
export function snoozeNotification(id: string, until: string) {
  return api.patch<NotificationItem>(`/notifications/${id}/snooze`, { until })
}
export function deleteNotification(id: string) {
  return api.delete<{ deleted: boolean }>(`/notifications/${id}`)
}
export function getNotificationCategories() {
  return api.get<NotificationCategory[]>("/notifications/categories")
}
export function getNotificationPreferences() {
  return api.get<NotificationPreference[]>("/notifications/preferences")
}
export function updateNotificationPreference(category: string, input: NotificationPreferenceInput) {
  return api.patch<NotificationPreference>(`/notifications/preferences/${encodeURIComponent(category)}`, input)
}
