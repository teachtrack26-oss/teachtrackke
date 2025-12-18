import type { NextConfig } from "next";

// @ts-ignore
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
    formats: ["image/webp", "image/avif"],
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "your-r2-bucket.r2.cloudflarestorage.com",
      },
    ],
  },
  experimental: {
    // serverActions is enabled by default in recent Next.js versions
  },
  webpack: (config) => {
    return config;
  },
  // Removed turbopack.root - conflicts with Vercel's outputFileTracingRoot
  async rewrites() {
    // Use environment variable or fallback to localhost
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://10.2.0.2:8000";

    return [
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
