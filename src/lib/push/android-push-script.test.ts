import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import sharp from "sharp"
import {
  ACCENT_COLOR,
  APP_ID,
  assertForApp,
  decodeGoogleServices,
  installNotificationResources,
  patchManifest,
  removePlugin,
} from "../../../scripts/android-push.mjs"

const DENSITIES: Record<string, number> = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 }

/** The manifest `cap add android` generates (Capacitor 8.5.2 template). */
const TEMPLATE_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/AppTheme">

        <activity android:name=".MainActivity" android:exported="true">
        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="\${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`

const googleServicesFor = (pkg: string) => ({
  project_info: { project_id: "mga" },
  client: [{ client_info: { android_client_info: { package_name: pkg } } }],
})

describe("android-push build script", () => {
  it("adds the Android 13 notification permission, which the plugin does not declare", () => {
    const out = patchManifest(TEMPLATE_MANIFEST)
    expect(out).toContain('<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />')
    // Inside <manifest>, alongside INTERNET -- not inside <application>.
    expect(out.indexOf("POST_NOTIFICATIONS")).toBeGreaterThan(out.indexOf("</application>"))
    expect(out.indexOf("POST_NOTIFICATIONS")).toBeLessThan(out.indexOf("</manifest>"))
  })

  it("points FCM's default channel at the named one, inside <application>", () => {
    const out = patchManifest(TEMPLATE_MANIFEST)
    const at = out.indexOf("default_notification_channel_id")
    expect(at).toBeGreaterThan(out.indexOf("</provider>"))
    expect(at).toBeLessThan(out.indexOf("</application>"))
    expect(out).toContain('android:value="general"')
  })

  it("is idempotent", () => {
    const once = patchManifest(TEMPLATE_MANIFEST)
    expect(patchManifest(once)).toBe(once)
  })

  it("accepts the file as raw JSON or base64", () => {
    const json = JSON.stringify(googleServicesFor(APP_ID))
    expect(decodeGoogleServices(json).parsed.project_info.project_id).toBe("mga")
    expect(decodeGoogleServices(Buffer.from(json).toString("base64")).parsed.project_info.project_id).toBe("mga")
    expect(() => decodeGoogleServices("not json at all")).toThrow(/neither JSON nor base64/)
  })

  it("refuses a google-services.json issued for another app, which would build and never receive a push", () => {
    expect(() => assertForApp(googleServicesFor(APP_ID))).not.toThrow()
    expect(() => assertForApp(googleServicesFor("com.example.other"))).toThrow(
      /no Android app for com\.mygymagent\.app \(found: com\.example\.other\)/,
    )
  })

  it("removes the plugin from package.json and node_modules when push is disabled", () => {
    const root = mkdtempSync(join(tmpdir(), "android-push-"))
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ dependencies: { "@capacitor/core": "8.5.2", "@capacitor/push-notifications": "8.1.2" } }),
    )
    const pluginDir = join(root, "node_modules/@capacitor/push-notifications")
    mkdirSync(pluginDir, { recursive: true })
    writeFileSync(join(pluginDir, "package.json"), "{}")

    removePlugin(root)

    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
    expect(pkg.dependencies).toEqual({ "@capacitor/core": "8.5.2" })
    expect(existsSync(pluginDir)).toBe(false)
  })

  it("sets the monochrome status-bar icon and brand colour, instead of the launcher icon", () => {
    const out = patchManifest(TEMPLATE_MANIFEST)
    for (const key of ["default_notification_icon", "default_notification_color"]) {
      const at = out.indexOf(`com.google.firebase.messaging.${key}"`)
      expect(at).toBeGreaterThan(-1)
      expect(at).toBeLessThan(out.indexOf("</application>"))
    }
    expect(out).toContain('android:resource="@drawable/ic_stat_notify"')
    expect(out).toContain('android:resource="@color/push_notification_color"')
  })

  it("installs the icon at every density and the colour resource", () => {
    const root = mkdtempSync(join(tmpdir(), "android-res-"))
    mkdirSync(join(root, "android/app/src/main/res"), { recursive: true })
    // The real committed assets, via a copy of the repo's assets dir.
    const repo = join(__dirname, "../../..")
    cpSync(join(repo, "assets"), join(root, "assets"), { recursive: true })

    installNotificationResources(root)

    for (const density of Object.keys(DENSITIES)) {
      expect(existsSync(join(root, `android/app/src/main/res/drawable-${density}/ic_stat_notify.png`))).toBe(true)
    }
    const colors = readFileSync(join(root, "android/app/src/main/res/values/push_notification_color.xml"), "utf8")
    expect(colors).toContain(`<color name="push_notification_color">${ACCENT_COLOR}</color>`)
  })

  it("ships icons Android can draw as a silhouette: right size, transparent, white only", async () => {
    const repo = join(__dirname, "../../..")
    for (const [density, px] of Object.entries(DENSITIES)) {
      const file = join(repo, `assets/android/res/drawable-${density}/ic_stat_notify.png`)
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      expect([info.width, info.height]).toEqual([px, px])
      let transparent = 0
      let visible = 0
      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3]
        if (alpha === 0) transparent++
        // Fully drawn pixels must be white: colour is thrown away, and an
        // opaque background is what turns an icon into a solid disc.
        if (alpha === 255) {
          visible++
          expect([data[i], data[i + 1], data[i + 2]]).toEqual([255, 255, 255])
        }
      }
      expect(transparent).toBeGreaterThan(0)
      expect(visible).toBeGreaterThan(0)
    }
  })
})
