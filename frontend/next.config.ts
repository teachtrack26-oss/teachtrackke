import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      // Silence root inference warning explicitly
      root: process.cwd(),
    },
    serverActions: true,
  },
};

export default nextConfig;
