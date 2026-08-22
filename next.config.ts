import type { NextConfig } from "next";

import path from "path";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;

// import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
