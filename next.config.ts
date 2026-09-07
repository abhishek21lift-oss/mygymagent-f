import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  allowedDevOrigins: [
    "3000-56d39e1e-dfbb-4e33-a41e-4b5e25e67684.daytonaproxy01.net",
  ],
  async headers() {
    // Local development talks to the local API over plain http; the
    // production CSP (https: only) must stay untouched.
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
              "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://connect.facebook.net https://www.facebook.com; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' https://cdnjs.cloudflare.com; " +
              "connect-src 'self' https:" + devApiOrigin + "; " +
              "frame-src https://www.facebook.com https://*.facebook.com https://*.facebook.net; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';",
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
