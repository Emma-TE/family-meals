/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Empty turbopack config to silence the warning
  turbopack: {},
}

module.exports = nextConfig