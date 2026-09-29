import config from "../../../capacitor.config"
import manifest from "@/app/manifest"

describe("Android app identity", () => {
  it("keeps the package id installs and Firebase depend on", () => {
    // Changing it makes a different app: existing installs cannot update,
    // and google-services.json (scripts/android-push.mjs) stops matching.
    expect(config.appId).toBe("com.mygymagent.app")
  })

  it("uses a launcher label short enough not to be cut off, matching the iPhone one", () => {
    expect(config.appName.length).toBeLessThanOrEqual(12)
    expect(config.appName).toBe(manifest().short_name)
  })
})
