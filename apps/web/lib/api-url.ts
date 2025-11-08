/**
 * Unified API URL configuration
 * 
 * Single source of truth for determining the API base URL in both client and server contexts.
 * 
 * Development: Calls backend directly at http://localhost:4000 (or NEXT_PUBLIC_API_URL)
 * Production: Uses relative /api path which goes through Vercel serverless wrapper
 */

/**
 * Get the API base URL for making HTTP requests
 * 
 * - In production: Returns '/api' (relative path handled by Vercel serverless wrapper)
 * - In development: Returns 'http://localhost:4000' or NEXT_PUBLIC_API_URL if set
 * 
 * Works in both client and server-side contexts (Next.js Server Components, API routes, etc.)
 */
export function getApiBaseUrl(): string {
  // In production, use relative /api path (goes through Vercel serverless wrapper)
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }

  // In development, use NEXT_PUBLIC_API_URL if set, otherwise default to localhost:4000
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    // Remove /api suffix if present, backend doesn't use it
    if (url.endsWith('/api')) {
      return url.slice(0, -4); // Remove '/api'
    }
    return url;
  }

  // Default to localhost:4000 in development (backend runs on port 4000)
  return 'http://localhost:4000';
}

/**
 * Get the full API URL for a specific endpoint
 * 
 * @param endpoint - API endpoint path (e.g., '/auth/login', '/projects')
 * @returns Full URL including base URL and endpoint
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;
  
  // In production, if we're server-side and the URL is relative, make it absolute
  // This is needed for fetch() calls from NextAuth authorize function
  if (process.env.NODE_ENV === 'production' && url.startsWith('/')) {
    // Check if we're in a server-side context (no window object)
    if (typeof window === 'undefined') {
      // Construct absolute URL using Vercel URL or fallback
      const host = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || 'https://genie-teal.vercel.app';
      return `${host}${url}`;
    }
  }
  
  return url;
}

