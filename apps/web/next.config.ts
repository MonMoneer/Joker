import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@joker/engine", "@joker/i18n"],
};

export default nextConfig;
