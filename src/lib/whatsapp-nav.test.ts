import { renderHook } from "@testing-library/react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  isWhatsAppNavActive,
  isWhatsAppRoute,
  useVisibleWhatsAppNav,
  WHATSAPP_NAV_GROUPS,
} from "./whatsapp-nav";

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

describe("isWhatsAppRoute", () => {
  it.each([
    "/whatsapp",
    "/whatsapp#contacts",
    "/inbox",
    "/inbox?to=919876543210",
    "/broadcasts",
    "/broadcasts/abc",
    "/settings/whatsapp",
    "/settings/whatsapp/overview",
    "/settings/whatsapp#auto-replies",
    "/settings/messages",
  ])("treats %s as WhatsApp mode", (pathname) => {
    expect(isWhatsAppRoute(pathname)).toBe(true);
  });

  it.each([
    "/dashboard",
    "/members",
    "/members/abc",
    "/settings",
    "/settings/profile",
    "/settings/billing",
    "/billing",
    "/crm",
    "/attendance",
    null,
    undefined,
    "",
  ])("treats %s as normal mode", (pathname) => {
    expect(isWhatsAppRoute(pathname)).toBe(false);
  });

  it("does not match lookalike prefixes", () => {
    expect(isWhatsAppRoute("/whatsappx")).toBe(false);
    expect(isWhatsAppRoute("/inbox-archive")).toBe(false);
    expect(isWhatsAppRoute("/settings/whatsappx")).toBe(false);
  });
});

describe("isWhatsAppNavActive", () => {
  it("matches the dashboard entry exactly", () => {
    expect(isWhatsAppNavActive("/whatsapp", "/whatsapp")).toBe(true);
    expect(isWhatsAppNavActive("/whatsapp/extra", "/whatsapp")).toBe(false);
  });

  it("matches entries and their children by base path", () => {
    expect(isWhatsAppNavActive("/inbox", "/inbox")).toBe(true);
    expect(isWhatsAppNavActive("/broadcasts/abc", "/broadcasts")).toBe(true);
    expect(isWhatsAppNavActive("/settings/whatsapp/overview", "/settings/whatsapp")).toBe(true);
  });

  it("matches hash-anchored entries by base path", () => {
    expect(isWhatsAppNavActive("/settings/whatsapp", "/settings/whatsapp#auto-replies")).toBe(true);
    expect(isWhatsAppNavActive("/whatsapp", "/whatsapp#contacts")).toBe(true);
  });

  it("is false without a pathname or on unrelated routes", () => {
    expect(isWhatsAppNavActive(null, "/inbox")).toBe(false);
    expect(isWhatsAppNavActive("/dashboard", "/inbox")).toBe(false);
  });
});

describe("useVisibleWhatsAppNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows every entry the person may open", () => {
    mockUseAuth.mockReturnValue({ hasPermission: () => true });
    const { result } = renderHook(() => useVisibleWhatsAppNav());
    const total = WHATSAPP_NAV_GROUPS.reduce((n, g) => n + g.entries.length, 0);
    expect(result.current.total).toBe(total);
    expect(result.current.total).toBeGreaterThan(0);
  });

  it("hides everything without permissions", () => {
    mockUseAuth.mockReturnValue({ hasPermission: () => false });
    const { result } = renderHook(() => useVisibleWhatsAppNav());
    expect(result.current.groups).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it("keeps whatsapp.read entries for a reader without manage rights", () => {
    mockUseAuth.mockReturnValue({
      hasPermission: (key: string | string[]) =>
        (Array.isArray(key) ? key : [key]).includes("whatsapp.read"),
    });
    const { result } = renderHook(() => useVisibleWhatsAppNav());
    const titles = result.current.groups.flatMap((g) => g.entries.map((e) => e.title));
    expect(titles).toContain("Chat");
    expect(titles).not.toContain("Broadcasts");
  });
});
