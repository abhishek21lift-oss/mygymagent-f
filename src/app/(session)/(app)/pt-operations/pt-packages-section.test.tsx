import "@testing-library/jest-dom"
import * as React from "react"
import { render, screen } from "@testing-library/react"
import { PtPackagesSection } from "./pt-packages-section"

jest.mock("@/lib/auth/auth-context", () => ({ useAuth: jest.fn() }))
jest.mock("@/lib/hooks/use-pt-packages", () => ({
  usePtPackages: jest.fn(),
  useCreatePtPackage: jest.fn(),
}))
jest.mock("@/lib/hooks/use-branches", () => ({ useBranches: jest.fn() }))

import { useAuth } from "@/lib/auth/auth-context"
import { usePtPackages } from "@/lib/hooks/use-pt-packages"

const mockedAuth = useAuth as jest.Mock
const mockedPackages = usePtPackages as jest.Mock

function renderAs(permissions: string[]) {
  mockedAuth.mockReturnValue({
    hasPermission: (key: string | string[]) =>
      Array.isArray(key) ? key.some((k) => permissions.includes(k)) : permissions.includes(key),
  })
  mockedPackages.mockReturnValue({ data: [], isLoading: false, isError: false })
  return render(<PtPackagesSection />)
}

/**
 * The backend serves `pt-packages.read_assigned` to trainers, scoped to
 * their assigned clients; this section used to gate on the flat key
 * only, so it hid from the one role whose PT data it shows.
 */
describe("PtPackagesSection", () => {
  it("renders for a trainer holding only pt-packages.read_assigned", () => {
    renderAs(["pt-packages.read_assigned"])
    expect(screen.getByText("PT packages")).toBeInTheDocument()
  })

  it("renders nothing without either read grant", () => {
    renderAs(["members.read"])
    expect(screen.queryByText("PT packages")).not.toBeInTheDocument()
  })
})
