import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only for the Docker build path (Dockerfile sets DOCKER_BUILD=1) -- bundles
  // runtime-needed files into .next/standalone for a lean image. Must stay
  // unset for Vercel: standalone mode skips the *.nft.json trace output
  // Vercel's own build packaging depends on, and its build fails without it.
  ...(process.env.DOCKER_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
