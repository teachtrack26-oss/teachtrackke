import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"],
  },
  experimental: {
    turbopack: {
      // Silence root inference warning explicitly
      root: process.cwd(),
    },
    serverActions: true,
  },
};

export default nextConfig;
