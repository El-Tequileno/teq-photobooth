/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Backend receives captured photo as base64; raise body size limit.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

module.exports = nextConfig;
