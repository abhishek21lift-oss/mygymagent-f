import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  APP_ID,
  assertForApp,
  decodeGoogleServices,
  patchManifest,
  removePlugin,
} from "../../../scripts/android-push.mjs"

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
})
