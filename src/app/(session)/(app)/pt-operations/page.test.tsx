import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen } from "@testing-library/react";

import PtOperationsPage from "./page";

let mockPermissions: string[] = [];
jest.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    hasPermission: (key: string | string[]) =>
      (Array.isArray(key) ? key : [key]).some((k) => mockPermissions.includes(k)),
  }),
}));

jest.mock("@/lib/hooks/use-workouts", () => ({
  useWorkoutAssignments: () => ({ data: { items: [], total: 0 }, isLoading: false, isError: false }),
  useUpdateWorkoutAssignmentStatus: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock("./pt-packages-section", () => ({ PtPackagesSection: () => null }));

describe("PtOperationsPage Ask AI entry", () => {
  it("offers the AI shortcut alongside Manage workouts when the caller can generate", () => {
    mockPermissions = ["workouts.read", "ai.generate"];
    render(<PtOperationsPage />);
    expect(screen.getByRole("link", { name: /Ask AI/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Manage workouts/ })).toBeInTheDocument();
  });

  it("keeps Manage workouts but hides the AI shortcut without ai.generate", () => {
    mockPermissions = ["workouts.read"];
    render(<PtOperationsPage />);
    expect(screen.queryByRole("link", { name: /Ask AI/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Manage workouts/ })).toBeInTheDocument();
  });
});
