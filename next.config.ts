import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // react-map-gl uses subpath exports (./mapbox) without a 'browser' condition.
  // transpilePackages forces Next.js/Turbopack to compile them through its own bundler.
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
