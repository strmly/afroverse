/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['storage.googleapis.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  
  // Enable gzip compression
  compress: true,
  
  // TypeScript and ESLint handling
  typescript: {
    // Don't fail build on type errors during Vercel deployment
    ignoreBuildErrors: false,
  },
  
  eslint: {
    // Don't fail build on ESLint errors during Vercel deployment
    ignoreDuringBuilds: false,
  },
  
  // Environment variables (public only)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AfroMoji',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
}

module.exports = nextConfig



