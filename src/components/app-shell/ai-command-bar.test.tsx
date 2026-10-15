import "@testing-library/jest-dom";
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { AICommandBar } from "./ai-command-bar";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}));

describe("AICommandBar", () => {
  it("offers the trigger to callers with ai.generate", () => {
    mockPermissions = ["ai.generate"];
    render(<AICommandBar />);
    expect(screen.getByRole("button", { name: /Ask AI assistant/ })).toBeInTheDocument();
  });

  it("opens the command center on Ctrl/⌘K for callers with ai.generate", () => {
    mockPermissions = ["ai.generate"];
    render(<AICommandBar />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "THE CULT CLIENT AI command center" })).toBeInTheDocument();
  });

  it("renders nothing and ignores Ctrl/⌘K without ai.generate", () => {
    mockPermissions = ["members.read"];
    render(<AICommandBar />);
    expect(screen.queryByRole("button", { name: /Ask AI assistant/ })).not.toBeInTheDocument();
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
