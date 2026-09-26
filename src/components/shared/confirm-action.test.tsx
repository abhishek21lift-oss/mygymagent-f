import * as React from "react"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"

import { ConfirmAction } from "./confirm-action"

const toastSuccess = jest.fn()
const toastError = jest.fn()
jest.mock("sonner", () => ({
 toast: {
  success: (...args: unknown[]) => toastSuccess(...args),
  error: (...args: unknown[]) => toastError(...args),
 },
}))

function renderAction(onConfirm: () => Promise<unknown>) {
 return render(
  <ConfirmAction
   label="Cancel sale"
   title="Cancel sale INV-1?"
   description="Every line not already returned goes back on hand."
   confirmLabel="Cancel sale"
   successMessage="Sale cancelled"
   errorMessage="Could not cancel this sale."
   onConfirm={onConfirm}
  />,
 )
}

describe("ConfirmAction", () => {
 beforeEach(() => {
  toastSuccess.mockClear()
  toastError.mockClear()
 })

 it("does not fire the action until it is confirmed", async () => {
  const onConfirm = jest.fn().mockResolvedValue(undefined)
  renderAction(onConfirm)

  // The point of the component: one click opens the question, it does not
  // perform the irreversible thing.
  fireEvent.click(screen.getByRole("button", { name: "Cancel sale" }))
  expect(onConfirm).not.toHaveBeenCalled()

  await screen.findByRole("dialog")
  fireEvent.click(screen.getByRole("button", { name: "Keep as is" }))
  expect(onConfirm).not.toHaveBeenCalled()
 })

 it("runs the action and reports success once confirmed", async () => {
  const onConfirm = jest.fn().mockResolvedValue(undefined)
  renderAction(onConfirm)

  fireEvent.click(screen.getByRole("button", { name: "Cancel sale" }))
  const dialog = await screen.findByRole("dialog")
  expect(dialog.textContent).toMatch(/Cancel sale INV-1\?/)

  fireEvent.click(
   within(dialog).getByRole("button", { name: "Cancel sale" }),
  )
  await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(toastSuccess).toHaveBeenCalledWith("Sale cancelled"))
 })

 it("surfaces the API's own message and leaves the dialog open on failure", async () => {
  const onConfirm = jest
   .fn()
   .mockRejectedValue(new Error("Sale cannot be cancelled in its current status"))
  renderAction(onConfirm)

  fireEvent.click(screen.getByRole("button", { name: "Cancel sale" }))
  const dialog = await screen.findByRole("dialog")
  fireEvent.click(within(dialog).getByRole("button", { name: "Cancel sale" }))

  await waitFor(() =>
   expect(toastError).toHaveBeenCalledWith(
    "Sale cannot be cancelled in its current status",
   ),
  )
  // A failed attempt must not look like it worked, so the dialog stays.
  expect(screen.getByRole("dialog")).toBeTruthy()
 })
})
