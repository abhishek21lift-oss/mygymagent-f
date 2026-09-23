import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { NotificationCenter } from "./notification-center"

jest.mock("next/navigation", () => ({
 useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
}))

jest.mock("@/lib/notifications", () => ({
 getNotifications: jest.fn().mockResolvedValue({ items: [], unreadCount: 0 }),
 markNotificationRead: jest.fn(),
 markAllNotificationsRead: jest.fn(),
}))

describe("NotificationCenter", () => {
 it("renders an accessible notification trigger", async () => {
 const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
 render(
 <QueryClientProvider client={client}>
 <NotificationCenter />
 </QueryClientProvider>,
 )

 expect(await screen.findByRole("button", { name: "Notifications" })).toBeTruthy()
 })
})
