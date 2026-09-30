import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Organization } from "@/lib/types/auth";
import GymProfilePage from "./page";

jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client");
  return {
    ...actual,
    api: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    },
  };
});
jest.mock("@/lib/auth/auth-context", () => ({ useAuth: jest.fn() }));
jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const org: Organization = {
  id: "org-1",
  name: "619 Fitness Studio",
  slug: "619",
  status: "ACTIVE",
  timezone: "Asia/Kolkata",
  currency: "INR",
  parentOrganizationId: null,
  settings: {},
  logoUrl: null,
  contactPhone: null,
  contactEmail: null,
  website: null,
  instagram: null,
  emailFromName: null,
  emailReplyTo: null,
  createdAt: "",
  updatedAt: "",
};

const branches = {
  items: [
    {
      id: "b-1",
      name: "Main",
      addressLine1: null,
      city: null,
      phone: null,
      mapsUrl: null,
      openingHours: [0, 1, 2, 3, 4, 5].map((day) => ({
        day,
        open: "05:00",
        close: "22:00",
      })),
    },
  ],
  total: 1,
};

function renderPage(
  permissions: string[] = ["organizations.update", "branches.update"],
) {
  (useAuth as jest.Mock).mockReturnValue({
    hasPermission: (p: string) => permissions.includes(p),
  });
  (api.get as jest.Mock).mockImplementation((path: string) =>
    Promise.resolve(path === "/organizations/current" ? org : branches),
  );
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <GymProfilePage />
    </QueryClientProvider>,
  );
}

describe("Gym profile page", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves only the changed details", async () => {
    (api.patch as jest.Mock).mockResolvedValue({
      ...org,
      contactPhone: "+91 98765 43210",
      website: "https://six19.in",
    });
    renderPage();
    const save = await screen.findByRole("button", { name: "Save profile" });
    expect(save).toHaveProperty("disabled", true);

    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "+91 98765 43210" },
    });
    fireEvent.change(screen.getByLabelText("Website"), {
      target: { value: "six19.in" },
    });
    fireEvent.click(save);

    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith("/organizations/current", {
      contactPhone: "+91 98765 43210",
      website: "https://six19.in",
    });
  });

  it("shows what is wrong instead of saving", async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText("Email"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Enter a valid email.")).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("uploads a logo", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      ...org,
      logoUrl: "https://files.example/logo.png",
    });
    renderPage();
    await screen.findByRole("button", { name: "Upload logo" });
    const file = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47])],
      "logo.png",
      { type: "image/png" },
    );
    fireEvent.change(screen.getByLabelText("Logo file"), {
      target: { files: [file] },
    });
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    const [path, body] = (api.post as jest.Mock).mock.calls[0];
    expect(path).toBe("/organizations/current/logo");
    expect((body as FormData).get("file")).toBe(file);
    expect(await screen.findByAltText("619 Fitness Studio logo")).toBeTruthy();
  });

  it("refuses a logo that is too large before uploading", async () => {
    renderPage();
    await screen.findByRole("button", { name: "Upload logo" });
    const big = new File([new Uint8Array(3 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    fireEvent.change(screen.getByLabelText("Logo file"), {
      target: { files: [big] },
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("lists each branch's hours and flags a missing address", async () => {
    renderPage();
    expect(await screen.findByText("Mon–Sat: 5:00 am – 10:00 pm")).toBeTruthy();
    expect(screen.getByText("No address yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: /edit/i })).toBeTruthy();
  });

  it("is read-only without permission to edit", async () => {
    renderPage([]);
    expect(await screen.findByLabelText("Gym name")).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.queryByRole("button", { name: "Save profile" })).toBeNull();
    expect(screen.queryByRole("button", { name: /upload logo/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /edit/i })).toBeNull();
  });
});
