import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import { staffAccessState } from "@/lib/hooks/use-staff";
import { addStaffSchema, toAddStaffPayload, type AddStaffValues } from "@/lib/validation/gym";
import { AddStaffDialog, generatePassword } from "./add-staff-dialog";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } };
});
jest.mock("@/lib/auth/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// Radix's switch measures itself inside a form; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const roles = [
  { id: "r0", key: "ORG_OWNER", name: "Organization Owner", description: null, isSystem: true, isOrganizationSpecific: false, permissions: [] },
  { id: "r1", key: "TRAINER", name: "Trainer", description: null, isSystem: true, isOrganizationSpecific: false, permissions: [] },
  { id: "r2", key: "RECEPTIONIST", name: "Receptionist", description: null, isSystem: true, isOrganizationSpecific: false, permissions: [] },
];
const branches = { items: [{ id: "b1", name: "Main" }, { id: "b2", name: "Annexe" }], page: 1, pageSize: 100, total: 2, totalPages: 1 };

function renderDialog(permissions: string[]) {
  (useAuth as jest.Mock).mockReturnValue({ hasPermission: (k: string) => permissions.includes(k) });
  (api.get as jest.Mock).mockImplementation((url: string) =>
    Promise.resolve(url === "/roles" ? roles : url === "/branches" ? branches : {}),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AddStaffDialog />
    </QueryClientProvider>,
  );
}

const base: AddStaffValues = {
  firstName: " Kamla ",
  lastName: "Devi",
  phone: "",
  jobTitle: "",
  isTrainer: false,
  specializations: [],
  primaryBranchId: "b1",
  roleKey: "STAFF",
  allBranches: false,
  access: "NONE",
  email: "stale@example.com",
  password: "",
  salaryType: "DAILY",
  salaryAmount: "600",
  employeeCode: "",
  hireDate: "",
};

describe("toAddStaffPayload", () => {
  it("drops the email without app access and puts pay on the right rate", () => {
    expect(toAddStaffPayload(base, true)).toEqual({
      access: "NONE",
      email: undefined,
      password: undefined,
      firstName: "Kamla",
      lastName: "Devi",
      phone: undefined,
      primaryBranchId: "b1",
      roleKey: "STAFF",
      roleBranchId: "b1",
      jobTitle: undefined,
      isTrainer: false,
      specializations: undefined,
      employeeCode: undefined,
      hireDate: undefined,
      pay: { salaryType: "DAILY", baseSalary: 600 },
    });
    expect(toAddStaffPayload({ ...base, salaryType: "HOURLY", salaryAmount: "150" }, true).pay).toEqual({
      salaryType: "HOURLY",
      hourlyRate: 150,
    });
  });

  it("sends no pay without hr.manage, which the server would refuse", () => {
    expect(toAddStaffPayload(base, false).pay).toBeUndefined();
  });

  it("sends an org-wide grant when the role covers every branch", () => {
    expect(toAddStaffPayload({ ...base, allBranches: true }, true).roleBranchId).toBeUndefined();
  });
});

describe("addStaffSchema", () => {
  it("needs an email to sign in with, and a long enough password", () => {
    const invite = addStaffSchema.safeParse({ ...base, access: "INVITE", email: "" });
    expect(invite.success).toBe(false);
    const password = addStaffSchema.safeParse({ ...base, access: "PASSWORD", email: "a@b.co", password: "short" });
    expect(password.success).toBe(false);
    expect(addStaffSchema.safeParse({ ...base, access: "NONE", email: "" }).success).toBe(true);
  });

  it("wants a positive salary when a type is chosen", () => {
    expect(addStaffSchema.safeParse({ ...base, salaryAmount: "0" }).success).toBe(false);
    expect(addStaffSchema.safeParse({ ...base, salaryType: "NONE", salaryAmount: "" }).success).toBe(true);
  });
});

describe("staffAccessState", () => {
  it("tells signed in, pending, no access and switched off apart", () => {
    expect(staffAccessState({ status: "ACTIVE", email: "a@b.co", hasPassword: true })).toBe("SIGNED_IN");
    expect(staffAccessState({ status: "INVITED", email: "a@b.co", hasPassword: false })).toBe("INVITE_PENDING");
    expect(staffAccessState({ status: "ACTIVE", email: "a@b.co", hasPassword: false })).toBe("INVITE_PENDING");
    expect(staffAccessState({ status: "ACTIVE", email: null, hasPassword: false })).toBe("NO_ACCESS");
    expect(staffAccessState({ status: "DISABLED", email: "a@b.co", hasPassword: true })).toBe("OFF");
    // An API without hasPassword: ACTIVE reads as signed in, as before.
    expect(staffAccessState({ status: "ACTIVE", email: "a@b.co" })).toBe("SIGNED_IN");
  });
});

describe("generatePassword", () => {
  it("is long enough and skips look-alike characters", () => {
    const password = generatePassword();
    expect(password).toHaveLength(14);
    expect(password).not.toMatch(/[0O1lI]/);
  });
});

describe("AddStaffDialog", () => {
  it("walks the steps and adds a helper without app access, with daily pay", async () => {
    const user = userEvent.setup();
    (api.post as jest.Mock).mockResolvedValue({ id: "u1", firstName: "Kamla", lastName: "Devi" });
    renderDialog(["users.create", "hr.manage"]);

    await user.click(screen.getByRole("button", { name: /add staff/i }));
    const dialog = await screen.findByRole("dialog");

    // Required fields hold the first step.
    await user.click(within(dialog).getByRole("button", { name: /continue/i }));
    expect(await within(dialog).findByText("First name is required")).toBeTruthy();

    await user.type(within(dialog).getByLabelText("First name"), "Kamla");
    await user.type(within(dialog).getByLabelText("Last name"), "Devi");
    await user.click(within(dialog).getByRole("button", { name: /continue/i }));

    // Ownership is not handed out from here.
    await within(dialog).findByRole("radio", { name: "Trainer" });
    expect(within(dialog).queryByRole("radio", { name: "Organization Owner" })).toBeNull();
    await user.click(within(dialog).getByRole("radio", { name: "Receptionist" }));
    await user.click(within(dialog).getByRole("radio", { name: /annexe/i }));
    await user.click(within(dialog).getByRole("button", { name: /continue/i }));

    await user.click(within(dialog).getByRole("radio", { name: "No app access" }));
    await user.click(within(dialog).getByRole("button", { name: /continue/i }));

    await user.click(within(dialog).getByRole("radio", { name: "Daily" }));
    await user.type(within(dialog).getByLabelText(/amount per day/i), "600");
    await user.click(within(dialog).getByRole("button", { name: /continue/i }));

    await user.click(within(dialog).getByRole("button", { name: /add kamla/i }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith(
        "/users",
        expect.objectContaining({
          access: "NONE",
          email: undefined,
          firstName: "Kamla",
          roleKey: "RECEPTIONIST",
          primaryBranchId: "b2",
          roleBranchId: undefined,
          pay: { salaryType: "DAILY", baseSalary: 600 },
        }),
      ),
    );
    expect(await within(dialog).findByText(/kamla is on the team/i)).toBeTruthy();
  }, 15_000);

  it("has no pay step without hr.manage", async () => {
    const user = userEvent.setup();
    renderDialog(["users.create"]);
    await user.click(screen.getByRole("button", { name: /add staff/i }));
    const dialog = await screen.findByRole("dialog");
    const steps = within(dialog).getByRole("list", { name: "Steps" });
    expect(within(steps).queryByText("Pay")).toBeNull();
    expect(within(steps).getByText("Review")).toBeTruthy();
  });
});
