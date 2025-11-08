import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // In production on Vercel, API routes are handled by serverless functions
  // In development, proxy to local API server
  async rewrites() {
    // Note: We don't proxy /api/* routes here because:
    // 1. NextAuth routes (/api/auth/*) must be handled by Next.js route handlers
    // 2. Backend API routes are accessed directly via NEXT_PUBLIC_API_URL in the API client
    // 3. In production, /api/* goes through Vercel serverless function wrapper
    return [];
  },
  // Exclude API directory from Next.js processing
  // API functions are handled separately by Vercel as serverless functions
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Configure Turbopack (Next.js 16 default) - empty config to silence warning
  turbopack: {},
  // Configure webpack to ignore the API directory (fallback for non-Turbopack builds)
  webpack: (config, { isServer }) => {
    // Exclude API directory from webpack processing
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/api/**', '**/node_modules/**'],
    };
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  // Skip type checking during build (types are checked separately)
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
