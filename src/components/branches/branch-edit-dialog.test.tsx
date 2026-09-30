import * as React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { Branch } from "@/lib/types/gym";
import { BranchEditDialog } from "./branch-edit-dialog";

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
// Radix's switch measures itself inside a form; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const branch: Branch = {
  id: "b-1",
  organizationId: "org-1",
  name: "Main",
  slug: "main",
  status: "ACTIVE",
  timezone: null,
  phone: "020 5555 1234",
  email: null,
  addressLine1: null,
  addressLine2: null,
  city: "Pune",
  state: null,
  postalCode: null,
  country: null,
  mapsUrl: null,
  openingHours: null,
  createdAt: "",
  updatedAt: "",
};

function open() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <BranchEditDialog branch={branch} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: /edit/i }));
  return screen.getByRole("dialog");
}

describe("BranchEditDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  it("saves the address, directions and hours, blanks as null", async () => {
    (api.patch as jest.Mock).mockResolvedValue(branch);
    const dialog = open();
    fireEvent.change(within(dialog).getByLabelText("Street address"), {
      target: { value: "12 MG Road" },
    });
    fireEvent.change(within(dialog).getByLabelText("Google Maps link"), {
      target: { value: "https://maps.app.goo.gl/abc" },
    });
    fireEvent.change(within(dialog).getByLabelText("Phone"), {
      target: { value: "" },
    });
    fireEvent.click(within(dialog).getByRole("switch", { name: "Mon open" }));
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save branch" }),
    );

    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch).toHaveBeenCalledWith(
      "/branches/b-1",
      expect.objectContaining({
        addressLine1: "12 MG Road",
        city: "Pune",
        mapsUrl: "https://maps.app.goo.gl/abc",
        phone: null,
        email: null,
        openingHours: [{ day: 0, open: "06:00", close: "22:00" }],
      }),
    );
  });

  /** Long enough for a mutation to have reached the API if one started. */
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50));

  it("will not save a directions link that is not a web address", async () => {
    const dialog = open();
    fireEvent.change(within(dialog).getByLabelText("Google Maps link"), {
      target: { value: "near the park" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save branch" }),
    );
    expect(within(dialog).getByText(/starting with https/)).toBeTruthy();
    await settle();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("will not save hours that close before they open", async () => {
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("switch", { name: "Tue open" }));
    fireEvent.change(within(dialog).getByLabelText("Tue closes"), {
      target: { value: "05:00" },
    });
    expect(within(dialog).getByRole("alert").textContent).toMatch(
      /before it opens/,
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save branch" }),
    );
    await settle();
    expect(api.patch).not.toHaveBeenCalled();
  });

  it("splits a day into morning and evening", async () => {
    (api.patch as jest.Mock).mockResolvedValue(branch);
    const dialog = open();
    fireEvent.click(within(dialog).getByRole("switch", { name: "Wed open" }));
    fireEvent.change(within(dialog).getByLabelText("Wed closes"), {
      target: { value: "11:00" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Add another Wed time" }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save branch" }),
    );
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect((api.patch as jest.Mock).mock.calls[0][1].openingHours).toEqual([
      { day: 2, open: "06:00", close: "11:00" },
      { day: 2, open: "16:00", close: "22:00" },
    ]);
  });
});
