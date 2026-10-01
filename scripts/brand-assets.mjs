/**
 * Renders every brand image the app ships from one source file,
 * assets/brand/tcc-logo-source.png (the TCC logo on transparency).
 *
 *   node scripts/brand-assets.mjs
 *
 * Re-run after replacing the source; commit what it writes.
 *
 * The logo is wide (about 1.45:1). Square slots -- tab icon, Home Screen
 * icon, PWA and Android launcher icons -- centre it on a canvas sized
 * for that platform's safe area: an iOS or Android mask cuts the corners,
 * a maskable icon may be cropped to a circle of 80% of its width.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import sharp from "sharp"

const SOURCE = "assets/brand/tcc-logo-source.png"
/** Warm ivory: the glossy black, red and gold read best on light. */
const IVORY = "#FBF8F2"
/** The logo's own gold, for the faint ring behind it on app icons. */
const GOLD = "#E3A72F"

function out(path, buffer) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, buffer)
  console.log("wrote", path)
}

/** The logo cropped to its own edges, with a little air around it. */
async function trimmedLogo() {
  const trimmed = await sharp(SOURCE).trim({ threshold: 8 }).png().toBuffer()
  const { width, height } = await sharp(trimmed).metadata()
  const pad = Math.round(Math.max(width, height) * 0.03)
  return sharp(trimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
}

/** A soft ivory tile with a warm glow: the premium app-icon ground. */
function tileSvg(size, { round = false } = {}) {
  const r = round ? size / 2 : 0
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="70%" stop-color="${IVORY}"/>
      <stop offset="100%" stop-color="#F1E9DA"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#g)"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.42}" fill="url(#glow)"/>
</svg>`)
}

/**
 * The logo centred on a square: `scale` is the logo's width as a share of
 * the canvas. `background` false keeps it transparent.
 */
async function square(logo, size, scale, { background = true, round = false } = {}) {
  const width = Math.round(size * scale)
  const art = await sharp(logo).resize({ width, fit: "inside" }).png().toBuffer()
  const { height } = await sharp(art).metadata()
  const base = background
    ? sharp(tileSvg(size, { round }))
    : sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  return base
    .composite([{ input: art, left: Math.round((size - width) / 2), top: Math.round((size - height) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer()
}

/** A .ico holding PNG images, which every current browser reads. */
function ico(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  const entries = []
  let offset = 6 + pngs.length * 16
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt8(0, 2)
    e.writeUInt8(0, 3)
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    entries.push(e)
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

const logo = await trimmedLogo()

// In the interface: the full logo, transparent.
out("public/brand/tcc-logo.webp", await sharp(logo).resize({ width: 640 }).webp({ quality: 90, alphaQuality: 100 }).toBuffer())
out("public/brand/tcc-logo.png", await sharp(logo).resize({ width: 640 }).png({ compressionLevel: 9, palette: true, quality: 92 }).toBuffer())

// Browser tab: transparent, as large as the square allows.
out("src/app/icon.png", await square(logo, 256, 0.96, { background: false }))
out(
  "src/app/favicon.ico",
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await square(logo, size, 0.98, { background: false }) })))),
)

// iOS Home Screen: opaque (a transparent icon gets black corners).
const apple = await square(logo, 180, 0.76)
out("src/app/apple-icon.png", apple)
out("public/brand/apple-touch-icon.png", apple)

// Web app manifest.
out("public/brand/tcc-icon-192.png", await square(logo, 192, 0.8))
out("public/brand/tcc-icon-512.png", await square(logo, 512, 0.8))
// Maskable: kept inside the 80% safe circle.
out("public/brand/tcc-maskable-512.png", await square(logo, 512, 0.6))

// Android launcher (installed over the Capacitor template by CI).
const RES = "assets/android/launcher"
const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
const foreground = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 }
for (const [density, size] of Object.entries(legacy)) {
  out(`${RES}/mipmap-${density}/ic_launcher.png`, await square(logo, size, 0.78))
  out(`${RES}/mipmap-${density}/ic_launcher_round.png`, await square(logo, size, 0.72, { round: true }))
}
// Adaptive icons: a 108dp layer whose middle 66dp is always shown.
for (const [density, size] of Object.entries(foreground)) {
  out(`${RES}/mipmap-${density}/ic_launcher_foreground.png`, await square(logo, size, 0.58, { background: false }))
}
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`
out(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, Buffer.from(adaptive))
out(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, Buffer.from(adaptive))
out(
  `${RES}/values/ic_launcher_background.xml`,
  Buffer.from(`<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${IVORY}</color>\n</resources>\n`),
)

// Notification badge: Android draws only its alpha, in white, in the
// status bar -- so a white silhouette, not the coloured tile.
{
  const shape = await square(logo, 96, 0.96, { background: false })
  const alpha = await sharp(shape).extractChannel(3).toBuffer()
  out(
    "public/brand/tcc-badge-96.png",
    await sharp({ create: { width: 96, height: 96, channels: 3, background: "#ffffff" } })
      .joinChannel(alpha, { raw: undefined })
      .png()
      .toBuffer(),
  )
}

// Android launch screen: the Capacitor template shows @drawable/splash
// while the WebView starts. Same names and sizes as the template, so
// every density variant is replaced, not just the fallback.
{
  const splash = async (width, height) => {
    const logoWidth = Math.round(Math.min(width, height) * 0.5)
    const art = await sharp(logo).resize({ width: logoWidth }).png().toBuffer()
    const { height: artHeight } = await sharp(art).metadata()
    return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><radialGradient id="g" cx="50%" cy="45%" r="75%">
    <stop offset="0%" stop-color="#FFFFFF"/><stop offset="65%" stop-color="${IVORY}"/><stop offset="100%" stop-color="#EFE6D4"/>
  </radialGradient></defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
</svg>`))
      .composite([{ input: art, left: Math.round((width - logoWidth) / 2), top: Math.round((height - artHeight) / 2) }])
      .png({ compressionLevel: 9 })
      .toBuffer()
  }
  const portrait = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] }
  out(`${RES}/drawable/splash.png`, await splash(480, 320))
  for (const [density, [w, h]] of Object.entries(portrait)) {
    out(`${RES}/drawable-port-${density}/splash.png`, await splash(w, h))
    out(`${RES}/drawable-land-${density}/splash.png`, await splash(h, w))
  }
}
