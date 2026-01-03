/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['storage.googleapis.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Note: Vercel handles output automatically, don't use 'standalone' mode
  // output: 'standalone', // Disabled for Vercel deployment
  
  // Enable gzip compression
  compress: true,
  
  // Environment variables (public only)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'AfroMoji',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
}

module.exports = nextConfig



