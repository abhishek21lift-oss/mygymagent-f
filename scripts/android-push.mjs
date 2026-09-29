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
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

export const APP_ID = "com.mygymagent.app"
export const CHANNEL_ID = "general"
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
 * named channel the app creates, not a generic "Miscellaneous" one.
 * Idempotent: a second run changes nothing.
 */
export function patchManifest(xml) {
  let out = xml
  const permission = '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'
  if (!out.includes("android.permission.POST_NOTIFICATIONS")) {
    if (!out.includes("</manifest>")) throw new Error("AndroidManifest.xml has no </manifest>")
    out = out.replace("</manifest>", `    ${permission}\n</manifest>`)
  }
  const channel = `<meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="${CHANNEL_ID}" />`
  if (!out.includes("default_notification_channel_id")) {
    const close = out.lastIndexOf("</application>")
    if (close === -1) throw new Error("AndroidManifest.xml has no </application>")
    out = `${out.slice(0, close)}    ${channel}\n    ${out.slice(close)}`
  }
  return out
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
  console.log("Push enabled for this build: google-services.json written, manifest patched.")
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main()
  } catch (error) {
    console.error(`android-push: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}
