import type { NextConfig } from "next";
import tailwindcss from "@tailwindcss/postcss";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
