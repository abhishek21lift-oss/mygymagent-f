import { existsSync } from "fs"
import { join } from "path"
import manifest from "@/app/manifest"

describe("web app manifest", () => {
  const m = manifest()

  it("opens as its own app, which iOS requires before it offers push", () => {
    expect(m.display).toBe("standalone")
    expect(m.start_url).toBe("/login")
  })

  it("lists only icons that exist, at the sizes it claims", () => {
    const sizes = (m.icons ?? []).map((icon) => icon.sizes)
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]))
    for (const icon of m.icons ?? []) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true)
    }
  })

  it("offers a maskable icon, so Android's icon shapes do not crop the mark", () => {
    expect(m.icons?.some((icon) => icon.purpose === "maskable")).toBe(true)
  })
})
