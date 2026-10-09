import * as React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"

import { api } from "@/lib/api/client"
import { AddLeaveTypeDialog, RecordLeaveDialog, leaveCode } from "./leave-dialogs"

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))
// Radix's switch measures itself inside a form; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
jest.mock("@/lib/api/client", () => {
  const actual = jest.requireActual("@/lib/api/client")
  return { ...actual, api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() } }
})

const staff = {
  items: [
    { id: "sp-1", branchId: "b-1", user: { firstName: "Tara", lastName: "Trainer" } },
    { id: "sp-2", branchId: null, user: { firstName: "Nomad", lastName: "Staff" } },
  ],
}
const leaveTypes = [
  { id: "lt-1", name: "Casual leave", code: "CASUAL_LEAVE", paid: true },
  { id: "lt-2", name: "Unpaid leave", code: "UNPAID", paid: false },
]

describe("leaveCode", () => {
  it("turns a name into a short code", () => {
    expect(leaveCode(" Casual leave ")).toBe("CASUAL_LEAVE")
    expect(leaveCode("Sick / medical")).toBe("SICK_MEDICAL")
  })
})

describe("Add leave type", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(api.post as jest.Mock).mockResolvedValue({})
  })

  it("adds a type with a code made from its name", async () => {
    const onSaved = jest.fn()
    render(<AddLeaveTypeDialog open onOpenChange={() => {}} onSaved={onSaved} />)
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Casual leave" } })
    fireEvent.change(screen.getByLabelText("Days a year (optional)"), { target: { value: "12" } })
    fireEvent.click(screen.getByRole("button", { name: "Add leave type" }))
    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/hr-payroll/leave-types", {
        name: "Casual leave",
        code: "CASUAL_LEAVE",
        paid: true,
        annualQuota: 12,
      }),
    )
    expect(onSaved).toHaveBeenCalled()
  })
})

describe("Record leave", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(api.get as jest.Mock).mockResolvedValue(staff)
    ;(api.post as jest.Mock).mockResolvedValue({})
  })

  it("records leave for a staff member at their home branch", async () => {
    const onSaved = jest.fn()
    render(<RecordLeaveDialog open onOpenChange={() => {}} leaveTypes={leaveTypes} onSaved={onSaved} />)
    await screen.findByRole("option", { name: "Tara Trainer" })
    fireEvent.change(screen.getByLabelText("Staff member"), { target: { value: "sp-1" } })
    fireEvent.change(screen.getByLabelText("Leave type"), { target: { value: "lt-2" } })
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-11-02" } })
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-11-03" } })
    fireEvent.change(screen.getByLabelText("Reason (optional)"), { target: { value: "Competition" } })
    fireEvent.click(screen.getByRole("button", { name: "Record leave" }))

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith("/hr-payroll/leave-requests", {
        staffProfileId: "sp-1",
        leaveTypeId: "lt-2",
        branchId: "b-1",
        startDate: "2026-11-02",
        endDate: "2026-11-03",
        unit: "DAY",
        reason: "Competition",
      }),
    )
    expect(onSaved).toHaveBeenCalled()
  })

  it("explains, and does not submit, when the staff member has no home branch", async () => {
    render(<RecordLeaveDialog open onOpenChange={() => {}} leaveTypes={leaveTypes} onSaved={() => {}} />)
    await screen.findByRole("option", { name: "Nomad Staff" })
    fireEvent.change(screen.getByLabelText("Staff member"), { target: { value: "sp-2" } })
    expect(screen.getByRole("alert").textContent).toMatch(/no home branch/i)
    expect((screen.getByRole("button", { name: "Record leave" }) as HTMLButtonElement).disabled).toBe(true)
  })

  it("does not submit an end date before the start date", async () => {
    render(<RecordLeaveDialog open onOpenChange={() => {}} leaveTypes={leaveTypes} onSaved={() => {}} />)
    await screen.findByRole("option", { name: "Tara Trainer" })
    fireEvent.change(screen.getByLabelText("Staff member"), { target: { value: "sp-1" } })
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2026-11-05" } })
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2026-11-01" } })
    expect(screen.getByRole("alert").textContent).toMatch(/before the start date/i)
    expect((screen.getByRole("button", { name: "Record leave" }) as HTMLButtonElement).disabled).toBe(true)
  })
})
