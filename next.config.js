/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No static export: app uses API routes and dynamic [id] routes that depend on DB at runtime
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icon' }];
  },
}

module.exports = nextConfig
