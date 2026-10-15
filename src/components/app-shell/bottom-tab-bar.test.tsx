import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen } from "@testing-library/react";

import { BottomTabBar } from "./bottom-tab-bar";

jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard" }));

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}));

function renderBar() {
  return render(<BottomTabBar onOpenMore={jest.fn()} />);
}

describe("BottomTabBar", () => {
  it("hides the AI disc from callers without ai.generate", () => {
    mockPermissions = ["members.read", "attendance.read"];
    renderBar();
    expect(screen.queryByRole("link", { name: "AI Agent" })).not.toBeInTheDocument();
  });

  it("keeps the AI disc for callers with ai.generate", () => {
    mockPermissions = ["ai.generate"];
    renderBar();
    expect(screen.getByRole("link", { name: "AI Agent" })).toHaveAttribute("href", "/ai");
  });

  it("keeps the Attendance tab for a trainer who holds only attendance.read_assigned", () => {
    mockPermissions = ["members.read_assigned", "attendance.read_assigned"];
    renderBar();
    expect(screen.getByRole("link", { name: "Attendance" })).toHaveAttribute("href", "/attendance");
  });

  it("hides Attendance when neither attendance read grant is held", () => {
    mockPermissions = ["members.read"];
    renderBar();
    expect(screen.queryByRole("link", { name: "Attendance" })).not.toBeInTheDocument();
  });
});
