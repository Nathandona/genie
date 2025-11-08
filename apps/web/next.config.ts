import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // In production on Vercel, API routes are handled by serverless functions
  // In development, proxy to local API server
  async rewrites() {
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
