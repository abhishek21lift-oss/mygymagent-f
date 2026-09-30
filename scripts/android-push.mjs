#!/usr/bin/env node
/**
 * Push setup for the Android build (.github/workflows/android-apk.yml).
 *
 * The Android project is generated fresh by `cap add android` on every CI
 * run -- it is not committed -- so anything push needs has to be applied
 * after generation, every time:
 *
 *   node scripts/android-push.mjs enable   # GOOGLE_SERVICES_JSON is set
 *   node scripts/android-push.mjs disable  # it is not
 *
 * enable:  writes google-services.json (raw JSON or base64), refuses one
 *          issued for a different package -- that file builds cleanly and
 *          then never receives a push -- and patches the manifest.
 * disable: removes the push plugin before `cap sync`, so the app reports
 *          push as unavailable instead of offering a button that fails.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export const APP_ID = "com.mygymagent.app"
export const CHANNEL_ID = "general"
/** assets/android/res/drawable-<density>/ic_stat_notify.png, rendered from the SVG
 * by scripts/render-android-icon.mjs. */
export const ICON_NAME = "ic_stat_notify"
/** --primary from globals.css, as sRGB: tints the icon in the shade. */
export const ACCENT_COLOR = "#0065D3"
const COLOR_NAME = "push_notification_color"
const PLUGIN = "@capacitor/push-notifications"

/** Accepts the file's JSON as-is, or base64 of it (the form that survives
 * a GitHub secret without newline trouble). */
export function decodeGoogleServices(raw) {
  const text = raw.trim().startsWith("{") ? raw.trim() : Buffer.from(raw.trim(), "base64").toString("utf8")
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("GOOGLE_SERVICES_JSON is neither JSON nor base64-encoded JSON")
  }
  return { text, parsed }
}

export function assertForApp(googleServices, appId = APP_ID) {
  const packages = (googleServices.client ?? []).map(
    (client) => client?.client_info?.android_client_info?.package_name,
  )
  if (!packages.includes(appId)) {
    throw new Error(
      `google-services.json has no Android app for ${appId} (found: ${packages.filter(Boolean).join(", ") || "none"}). ` +
        `Add an Android app with package name ${appId} in the Firebase console and download its file again.`,
    )
  }
}

/**
 * Android 13+ shows no notification without POST_NOTIFICATIONS, and the
 * plugin does not declare it. The channel meta-data makes FCM use the
 * named channel the app creates, not a generic "Miscellaneous" one. The
 * icon and colour replace the launcher icon, which Android flattens to a
 * white disc in the status bar; Firebase reads the same meta-data whether
 * it draws the notification (app closed) or the plugin does (app open).
 * Idempotent: a second run changes nothing.
 */
export function patchManifest(xml) {
  let out = xml
  const permission = '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
  if (!out.includes("android.permission.POST_NOTIFICATIONS")) {
    if (!out.includes("</manifest>")) throw new Error("AndroidManifest.xml has no </manifest>")
    out = out.replace("</manifest>", `    ${permission}\n</manifest>`)
  }
  const metaData = [
    ["default_notification_channel_id", `android:value="${CHANNEL_ID}"`],
    ["default_notification_icon", `android:resource="@drawable/${ICON_NAME}"`],
    ["default_notification_color", `android:resource="@color/${COLOR_NAME}"`],
  ]
  for (const [key, attribute] of metaData) {
    if (out.includes(`com.google.firebase.messaging.${key}"`)) continue
    const close = out.lastIndexOf("</application>")
    if (close === -1) throw new Error("AndroidManifest.xml has no </application>")
    const tag = `<meta-data android:name="com.google.firebase.messaging.${key}" ${attribute} />`
    out = `${out.slice(0, close)}    ${tag}\n    ${out.slice(close)}`
  }
  return out
}

/** The monochrome status-bar icon and its accent colour, as resources. */
export function installNotificationResources(root) {
  const res = join(root, "android/app/src/main/res")
  cpSync(join(root, "assets/android/res"), res, { recursive: true })
  mkdirSync(join(res, "values"), { recursive: true })
  writeFileSync(
    join(res, "values", `${COLOR_NAME}.xml`),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="${COLOR_NAME}">${ACCENT_COLOR}</color>\n</resources>\n`,
  )
}

/** Drops the plugin from what `cap sync` will see. CI-only: edits the
 * checked-out package.json and node_modules, never anything committed. */
export function removePlugin(root) {
  const pkgPath = join(root, "package.json")
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  delete pkg.dependencies?.[PLUGIN]
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  rmSync(join(root, "node_modules", PLUGIN), { recursive: true, force: true })
}

function main() {
  const root = process.cwd()
  const mode = process.argv[2]
  if (mode === "disable") {
    removePlugin(root)
    console.log(`Push disabled for this build: ${PLUGIN} removed before cap sync.`)
    return
  }
  if (mode !== "enable") throw new Error("usage: android-push.mjs enable|disable")

  const raw = process.env.GOOGLE_SERVICES_JSON ?? ""
  if (!raw.trim()) throw new Error("GOOGLE_SERVICES_JSON is empty")
  const { text, parsed } = decodeGoogleServices(raw)
  assertForApp(parsed)
  writeFileSync(join(root, "android/app/google-services.json"), text)

  const manifestPath = join(root, "android/app/src/main/AndroidManifest.xml")
  if (!existsSync(manifestPath)) throw new Error(`${manifestPath} not found -- run cap add android first`)
  writeFileSync(manifestPath, patchManifest(readFileSync(manifestPath, "utf8")))
  installNotificationResources(root)
  console.log("Push enabled for this build: google-services.json written, manifest patched, notification icon installed.")
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main()
  } catch (error) {
    console.error(`android-push: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
