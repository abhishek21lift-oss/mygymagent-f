#!/usr/bin/env node
/**
 * Renders assets/android/ic_stat_notify.svg to the per-density PNGs Android
 * uses for the notification (status-bar) icon. Run after editing the SVG;
 * the PNGs are committed so CI needs no image tooling.
 *
 *   node scripts/render-android-icon.mjs
 */
import { mkdirSync, readFileSync } from "node:fs"
import sharp from "sharp"

// Android's 24dp small icon at each density bucket.
export const DENSITIES = { mdpi: 24, hdpi: 36, xhdpi: 48, xxhdpi: 72, xxxhdpi: 96 }

const svg = readFileSync("assets/android/ic_stat_notify.svg")
for (const [density, px] of Object.entries(DENSITIES)) {
  const dir = `assets/android/res/drawable-${density}`
  mkdirSync(dir, { recursive: true })
  // Rasterise well above the target size, then downsample, for clean edges.
  await sharp(svg, { density: Math.ceil((72 * px) / 24) * 4 })
    .resize(px, px)
    .png({ compressionLevel: 9 })
    .toFile(`${dir}/ic_stat_notify.png`)
  console.log(`${dir}/ic_stat_notify.png (${px}x${px})`)
}
