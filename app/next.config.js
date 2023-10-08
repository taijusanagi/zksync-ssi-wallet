/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@lens-protocol"],
  webpack: config => {
    config.resolve.fallback = { fs: false };
    return config;
  }
};

module.exports = nextConfig;
