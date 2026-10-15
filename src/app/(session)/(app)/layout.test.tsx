import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen } from "@testing-library/react";

import AppLayout from "./layout";

jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    mfaEnrolment: null,
    user: { id: "u1", firstName: "Asha", lastName: "K", platformRole: null },
  }),
}));

jest.mock("@/lib/use-section-attribute", () => ({ useSectionAttribute: jest.fn() }));
jest.mock("@/lib/push/web-push", () => ({ refreshWebPush: jest.fn(async () => undefined) }));
jest.mock("@/lib/push/native-push", () => ({ listenForNativeTaps: jest.fn(() => () => undefined) }));
jest.mock("@/lib/whatsapp-nav", () => ({
  isWhatsAppRoute: () => false,
  useVisibleWhatsAppNav: () => ({ total: 0, groups: [] }),
}));

// The shell's children are not what this test is about; stub them so the
// assertions run against the layout's own DOM.
jest.mock("@/components/app-shell/sidebar-nav", () => ({
  SidebarNav: () => <nav aria-label="Primary" />,
}));
jest.mock("@/components/app-shell/topbar", () => ({ Topbar: () => <header /> }));
jest.mock("@/components/app-shell/whatsapp-nav", () => ({
  WhatsAppSideNav: () => null,
  WhatsAppNavStrip: () => null,
}));
jest.mock("@/components/app-shell/mobile-nav", () => ({ MobileNav: () => null }));
jest.mock("@/components/app-shell/bottom-tab-bar", () => ({ BottomTabBar: () => null }));
jest.mock("@/components/security/mfa-required-gate", () => ({ MfaRequiredGate: () => null }));
jest.mock("@/components/security/mfa-grace-banner", () => ({ MfaGraceBanner: () => null }));
jest.mock("@/components/shared/pull-to-refresh", () => ({
  PullToRefresh: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// The layout reads the tablet breakpoint through matchMedia; jsdom has none.
beforeAll(() => {
  window.matchMedia ||= ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })) as unknown as typeof window.matchMedia;
});

describe("AppLayout shell accessibility", () => {
  it("offers a skip link before the rail, pointing at the main content", () => {
    render(
      <AppLayout>
        <p>Page body</p>
      </AppLayout>,
    );

    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main-content");

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Page body")).toBeInTheDocument();

    // The link precedes the navigation landmarks in the tab order.
    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(skip.compareDocumentPosition(primary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
