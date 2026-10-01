import type { MetadataRoute } from "next"

import { PRODUCT_NAME } from "@/lib/brand"

/**
 * Makes the web app installable, which is what web push on iPhone needs:
 * iOS only offers push to a site added to the Home Screen and opened from
 * there, and only a site with a manifest opens as its own app.
 *
 * `start_url` is /login because it resolves for everyone -- a signed-in
 * visitor is forwarded to their own home (dashboard or member portal),
 * and a signed-out one is already where they need to be.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PRODUCT_NAME,
    // The Home Screen label; iOS truncates beyond about twelve characters.
    short_name: "Cult Client",
    description: "Gym management, training and your membership in one app.",
    start_url: "/login",
    scope: "/",
    display: "standalone",
    background_color: "#f7f8fb",
    theme_color: "#f7f8fb",
    icons: [
      { src: "/brand/tcc-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/tcc-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Padded onto the brand background, so Android's circle/squircle
      // masks never crop the mark.
      {
        src: "/brand/tcc-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
