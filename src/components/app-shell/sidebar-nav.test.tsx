import * as React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { useAuth } from "@/lib/auth/auth-context";
import { activeChildHref, primaryNav, settingsNav, visibleNavItem } from "@/lib/nav-config";
import { SidebarNav } from "./sidebar-nav";

jest.mock("@/lib/auth/auth-context", () => ({ useAuth: jest.fn() }));
let mockPath = "/dashboard";
jest.mock("next/navigation", () => ({ usePathname: () => mockPath }));
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

function as(permissions: string[] | "all", path = "/dashboard") {
  mockPath = path;
  (useAuth as jest.Mock).mockReturnValue({
    user: { platformRole: null },
    hasPermission: (key: string | string[]) =>
      permissions === "all" || (Array.isArray(key) ? key : [key]).some((k) => permissions.includes(k)),
  });
}

// Radix's popover positions itself with ResizeObserver; jsdom has none.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

beforeEach(() => {
  window.localStorage.clear();
});

describe("SidebarNav", () => {
  it("opens a group without navigating or closing the drawer", async () => {
    const user = userEvent.setup();
    const onNavigate = jest.fn();
    as("all");
    render(<SidebarNav mobile onNavigate={onNavigate} />);

    const operations = screen.getByRole("button", { name: /operations/i });
    expect(operations.getAttribute("aria-expanded")).toBe("false");
    await user.click(operations);
    expect(operations.getAttribute("aria-expanded")).toBe("true");
    // The whole point: the drawer stays open on a group tap.
    expect(onNavigate).not.toHaveBeenCalled();

    await user.click(screen.getByRole("link", { name: "Branches" }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("keeps one group open at a time: opening another closes the one before", async () => {
    const user = userEvent.setup();
    as("all");
    render(<SidebarNav />);
    const groups = screen
      .getAllByRole("button")
      .filter((b) => b.hasAttribute("aria-expanded"))
      .slice(0, 2);
    expect(groups).toHaveLength(2);
    const [first, second] = groups;

    await user.click(first);
    expect(first.getAttribute("aria-expanded")).toBe("true");

    await user.click(second);
    expect(second.getAttribute("aria-expanded")).toBe("true");
    expect(first.getAttribute("aria-expanded")).toBe("false");

    // Tapping the open one closes it, leaving none open.
    await user.click(second);
    expect(second.getAttribute("aria-expanded")).toBe("false");
    expect(first.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the current page's group when another is opened, and remembers the choice", async () => {
    const user = userEvent.setup();
    as("all", "/inventory/sales");
    const { unmount } = render(<SidebarNav />);
    const operations = screen.getByRole("button", { name: /operations/i });
    expect(operations.getAttribute("aria-expanded")).toBe("true");

    const other = screen
      .getAllByRole("button")
      .find((b) => b.hasAttribute("aria-expanded") && b !== operations)!;
    await user.click(other);
    expect(other.getAttribute("aria-expanded")).toBe("true");
    expect(operations.getAttribute("aria-expanded")).toBe("false");

    unmount();
    render(<SidebarNav />);
    expect(screen.getByRole("button", { name: other.textContent ?? "" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: /operations/i }).getAttribute("aria-expanded")).toBe("false");
  });

  it("opens the group holding the current page, and marks only the most specific page", () => {
    as("all", "/inventory/sales");
    render(<SidebarNav />);
    expect(screen.getByRole("button", { name: /operations/i }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("link", { name: "Product sales" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Inventory" }).getAttribute("aria-current")).toBeNull();
  });

  it("remembers a group the user closed", async () => {
    const user = userEvent.setup();
    as("all", "/staff");
    const { unmount } = render(<SidebarNav />);
    await user.click(screen.getByRole("button", { name: /team/i }));
    unmount();
    render(<SidebarNav />);
    expect(screen.getByRole("button", { name: /team/i }).getAttribute("aria-expanded")).toBe("false");
  });

  it("links the pages that were reachable only from inside other pages", async () => {
    const user = userEvent.setup();
    as("all");
    render(<SidebarNav />);
    await user.click(screen.getByRole("button", { name: /engage/i }));
    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(screen.getByRole("button", { name: /finance/i }));
    for (const name of ["WhatsApp", "Automations", "Message templates", "Gym profile", "Member tags", "Security", "Subscription", "Setup guide"]) {
      expect(screen.getByRole("link", { name })).toBeTruthy();
    }
    // Dues and expenses were each reachable only from inside another page.
    expect(screen.getByRole("link", { name: "Outstanding dues" }).getAttribute("href")).toBe("/dashboard/outstanding");
    expect(screen.getByRole("link", { name: "Expenses" }).getAttribute("href")).toBe("/billing#expenses");
    // The rail's quick action and the Members page share one name.
    expect(
      screen.getAllByRole("link", { name: /add member/i }).every((a) => a.getAttribute("href") === "/members/new"),
    ).toBe(true);
  });

  it("shows an inventory manager Operations, which it used to hide behind attendance.read", () => {
    as(["inventory.read"], "/inventory");
    render(<SidebarNav />);
    const operations = screen.getByRole("button", { name: /operations/i });
    const list = document.getElementById(operations.getAttribute("aria-controls")!)!;
    expect(within(list).getByRole("link", { name: "Inventory" })).toBeTruthy();
    expect(within(list).queryByRole("link", { name: "Attendance" })).toBeNull();
    // Nothing they can't open.
    expect(screen.queryByRole("button", { name: /finance/i })).toBeNull();
  });

  it("opens a group beside the collapsed rail instead of navigating", async () => {
    as("all");
    render(<SidebarNav collapsed />);
    // fireEvent: userEvent's pointer model stalls on Radix's popover in jsdom.
    fireEvent.click(screen.getByLabelText("Finance"));
    expect(await screen.findByText("Payments")).toBeTruthy();
    expect(screen.getByText("Payments").closest("a")?.getAttribute("href")).toBe("/billing");
  });
});

describe("nav config", () => {
  const can = (granted: string[]) => (key: string | string[]) =>
    (Array.isArray(key) ? key : [key]).some((k) => granted.includes(k));

  it("drops a group with nothing the user can open", () => {
    const finance = primaryNav.find((i) => i.title === "Finance")!;
    expect(visibleNavItem(finance, can([]), false)).toBeNull();
    expect(visibleNavItem(finance, can(["payments.read"]), false)?.children?.map((c) => c.title)).toEqual([
      "Payments",
    ]);
  });

  it("gives everyone their own notification settings", () => {
    expect(visibleNavItem(settingsNav, can([]), false)?.children?.map((c) => c.href)).toEqual([
      "/settings/notifications",
    ]);
  });

  it("picks the most specific matching page", () => {
    const settings = settingsNav.children!;
    expect(activeChildHref("/settings/profile", settings)).toBe("/settings/profile");
    expect(activeChildHref("/settings", settings)).toBe("/settings");
    expect(activeChildHref("/members", settings)).toBeNull();
  });
});
