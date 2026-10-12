import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { WhatsAppNavStrip, WhatsAppSideNav } from "./whatsapp-nav";
import { useAuth } from "@/lib/auth/auth-context";

jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/inbox"),
}));

const mockUseAuth = useAuth as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({
    user: { id: "u1" },
    hasPermission: () => true,
  });
});

describe("WhatsAppSideNav", () => {
  it("brands the pane and links every entry at a real destination", () => {
    render(<WhatsAppSideNav />);

    expect(screen.getByRole("navigation", { name: "WhatsApp" })).toBeInTheDocument();
    expect(screen.getByText("Command center")).toBeInTheDocument();
    for (const href of [
      "/whatsapp",
      "/settings/whatsapp",
      "/inbox",
      "/broadcasts",
      "/whatsapp#contacts",
      "/settings/whatsapp#auto-replies",
      "/settings/whatsapp#bot-automation",
      "/settings/whatsapp#webhooks",
      "/settings/messages",
    ]) {
      expect(document.querySelector(`a[href="${href}"]`)).not.toBeNull();
    }
  });

  it("marks the current page", () => {
    render(<WhatsAppSideNav />);

    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("hides entries without permission", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1" },
      hasPermission: () => false,
    });
    render(<WhatsAppSideNav />);

    expect(screen.getByRole("navigation", { name: "WhatsApp" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Chat" })).not.toBeInTheDocument();
  });
});

describe("WhatsAppNavStrip", () => {
  it("renders the same destinations as compact pills", () => {
    render(<WhatsAppNavStrip />);

    expect(screen.getByRole("navigation", { name: "WhatsApp" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(document.querySelector('a[href="/settings/whatsapp#bot-automation"]')).not.toBeNull();
  });
});
