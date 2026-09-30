import { render, screen } from "@testing-library/react"

describe("legal details", () => {
  const saved = { ...process.env }
  afterEach(() => {
    process.env = { ...saved }
    jest.resetModules()
  })

  it("lists every detail still to be set, and none once they are", async () => {
    for (const key of Object.keys(process.env)) if (key.startsWith("NEXT_PUBLIC_LEGAL_")) delete process.env[key]
    const blank = await import("./legal")
    expect(blank.missingLegalDetails()).toEqual(Object.values(blank.LEGAL_ENV_NAMES))

    jest.resetModules()
    for (const name of Object.values(blank.LEGAL_ENV_NAMES)) process.env[name] = "  set  "
    const filled = await import("./legal")
    expect(filled.missingLegalDetails()).toEqual([])
    expect(filled.LEGAL.entityName).toBe("set")
  })

  it("marks an unset detail on the page instead of guessing one", async () => {
    const { Fact, EmailFact } = await import("@/app/(legal)/legal-ui")
    const { rerender } = render(<Fact value={null} label="registered address" />)
    expect(screen.getByText("[registered address — to be published]")).toBeTruthy()

    rerender(<EmailFact value="help@example.test" label="support email" />)
    expect(screen.getByRole("link", { name: "help@example.test" }).getAttribute("href")).toBe("mailto:help@example.test")
  })
})
