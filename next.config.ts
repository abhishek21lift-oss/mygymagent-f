import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundles only runtime-needed files into .next/standalone for a lean
  // Docker image (see Dockerfile / docs/deployment/overview.md).
  output: "standalone",
};

export default nextConfig;
