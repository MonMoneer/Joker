import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@joker/engine", "@joker/i18n"],
  experimental: {
    turbo: undefined, // Disable turbopack for production builds
  },
};

export default nextConfig;
