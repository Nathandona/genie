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
 *   BUT for server-side calls, we use '/api/v1' to avoid NextAuth route conflicts
 * - In development: Returns 'http://localhost:4000' or NEXT_PUBLIC_API_URL if set
 * 
 * Works in both client and server-side contexts (Next.js Server Components, API routes, etc.)
 */
export function getApiBaseUrl(): string {
  // In production, use relative /api path (goes through Vercel serverless wrapper)
  if (process.env.NODE_ENV === 'production') {
    // For server-side calls, use /api/v1 to avoid NextAuth route conflicts
    // NextAuth handles /api/auth/*, so we use /api/v1/auth/* for backend routes
    if (typeof window === 'undefined') {
      return '/api/v1';
    }
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
      // Construct absolute URL - prioritize NEXT_PUBLIC_APP_URL, then VERCEL_URL
      let host: string;
      
      if (process.env.NEXT_PUBLIC_APP_URL) {
        // Remove trailing slash if present
        host = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
      } else if (process.env.VERCEL_URL) {
        // VERCEL_URL doesn't include protocol, add it
        host = `https://${process.env.VERCEL_URL}`;
      } else {
        // Fallback - this should be set in production but use a sensible default
        host = 'https://genie-teal.vercel.app';
      }
      
      const absoluteUrl = `${host}${url}`;
      
      // Log in production for debugging (can be removed later)
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log('[getApiUrl] Server-side production URL:', absoluteUrl);
      }
      
      return absoluteUrl;
    }
  }
  
  return url;
}

