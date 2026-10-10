import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen } from "@testing-library/react"

import { Input } from "./input"
import { Textarea } from "./textarea"
import { Select, SelectTrigger, SelectValue } from "./select"

// Radix measures the trigger; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

/**
 * iOS Safari auto-zooms any focused editable control computing below
 * 16px. The shared fields carry text-base (16px) below the sm breakpoint
 * so phones never trip it; desktop keeps the denser text-sm. A global
 * guard in globals.css backs this up for native controls and one-off
 * overrides. These assertions pin the component half of that contract.
 */
describe("mobile auto-zoom guard", () => {
  it("renders text inputs at 16px on phones", () => {
    render(<Input aria-label="phone field" />)
    expect(screen.getByLabelText("phone field")).toHaveClass("text-base")
  })

  it("renders textareas at 16px on phones", () => {
    render(<Textarea aria-label="notes field" />)
    expect(screen.getByLabelText("notes field")).toHaveClass("text-base")
  })

  it("renders select triggers at 16px on phones", () => {
    render(
      <Select>
        <SelectTrigger aria-label="branch picker">
          <SelectValue placeholder="Pick one" />
        </SelectTrigger>
      </Select>,
    )
    expect(screen.getByLabelText("branch picker")).toHaveClass("text-base")
  })
})
