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
  // Turbopack config for Next.js 16+ in monorepo
  turbopack: {
    root: ".",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Required for Google Identity popups to communicate back via postMessage
          // without being blocked by COOP isolation.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
