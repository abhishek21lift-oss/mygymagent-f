import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel's Next.js builder expects the normal Next output.
  // The standalone bundle is only needed for the Docker image.
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  allowedDevOrigins: [
    "3000-56d39e1e-dfbb-4e33-a41e-4b5e25e67684.daytonaproxy01.net",
  ],
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; " +
              "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
              "script-src 'self' https://cdnjs.cloudflare.com; " +
              "img-src 'self' data: https:; " +
              "font-src 'self' https://cdnjs.cloudflare.com; " +
              "connect-src 'self' https:; " +
              "frame-src 'none'; " +
              "object-src 'none'; " +
              "base-uri 'self'; " +
              "form-action 'self';",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "off",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
