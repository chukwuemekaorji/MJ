/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true
  },
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: []
  }
};

export default nextConfig;
