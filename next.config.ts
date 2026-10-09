import type { NextConfig } from "next";

/** The public site's host. `www.` in front of it redirects to it, so search
 * engines index one address rather than splitting a page between two. */
const SITE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mygymagent.tech").host;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  allowedDevOrigins: [
    // Additional dev tunnel/proxy hostnames, comma-separated via
    // NEXT_ALLOWED_DEV_ORIGINS. Per the allowedDevOrigins guide only
    // hostnames are matched (no scheme/port).
    ...(process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
  // Links in notifications created before these pages had a home; the
  // app maps them too (src/lib/notification-links.ts), this covers a push
  // tapped in a browser that opens the old address directly.
  async redirects() {
    return [
      ...(SITE_HOST && !SITE_HOST.startsWith("www.")
        ? [
            {
              source: "/:path*",
              has: [{ type: "host" as const, value: `www.${SITE_HOST}` }],
              destination: `https://${SITE_HOST}/:path*`,
              permanent: true,
            },
          ]
        : []),
      { source: "/whatsapp/inbox", destination: "/settings/whatsapp", permanent: false },
      { source: "/pt/sessions/:id", destination: "/pt-operations/sessions", permanent: false },
      { source: "/inventory/products/:id((?!new$)[^/]+)", destination: "/inventory/reorder", permanent: false },
      // Retired copies of the owner home: one place for the day's figures.
      { source: "/owner-os", destination: "/dashboard", permanent: false },
      { source: "/command-center", destination: "/dashboard", permanent: false },
      // The old token-link member portal; members now sign in at /portal.
      { source: "/member-portal", destination: "/portal", permanent: true },
      // Platform console root redirects to platform command center
      { source: "/platform", destination: "/platform/command-center", permanent: false },
    ];
  },
  async headers() {
    // Local development talks to the local API over plain http; the
    // production CSP (https: only) must stay untouched.
    // Plausible analytics, only when a deployment turns it on (layout.tsx).
    const analyticsOrigin = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim() ? " https://plausible.io" : "";
    const devApiOrigin =
      process.env.NODE_ENV === "development" ? " http://localhost:4000" : "";
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
              "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://connect.facebook.net https://www.facebook.com" + analyticsOrigin + "; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' https://cdnjs.cloudflare.com; " +
              "connect-src 'self' https:" + devApiOrigin + "; " +
              "frame-src https://www.facebook.com https://*.facebook.com https://*.facebook.net; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self'; " +
              // The modern form of X-Frame-Options: DENY, for browsers that
              // honour only one of them.
              "frame-ancestors 'none';",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          // Only the camera is used (member photo, barcode and QR scanners);
          // everything else a page could ask the browser for is switched off.
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), hid=(), midi=()",
          },
          // Keeps other sites' windows from holding a handle on this one;
          // allow-popups so a window the app opens still works.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
