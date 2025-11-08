/**
 * Unified API URL configuration
 * 
 * Single source of truth for determining the API base URL in both client and server contexts.
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_API_URL: Public API URL for client-side requests (optional, defaults to /api in prod, localhost:4000 in dev)
 * - API_INTERNAL_URL: Internal API URL for server-side requests to Fastify backend (required in production)
 * 
 * Development: Calls backend directly at http://localhost:4000 (or NEXT_PUBLIC_API_URL)
 * Production: 
 *   - Client-side: Uses relative /api path (goes through Next.js API routes)
 *   - Server-side: Uses API_INTERNAL_URL to call Fastify backend directly
 */

/**
 * Get the API base URL for client-side requests
 * 
 * - In production: Returns '/api' (relative path handled by Next.js API routes)
 * - In development: Returns 'http://localhost:4000' or NEXT_PUBLIC_API_URL if set
 */
export function getApiBaseUrl(): string {
  // In production, use relative /api path (goes through Next.js API routes)
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
 * Get the internal API base URL for server-side requests
 * 
 * This is used when Next.js API routes need to call the Fastify backend.
 * In production on Vercel, we use /api/v1/* to route to Fastify (avoiding conflicts
 * with Next.js API routes at /api/*).
 * 
 * @returns Internal API base URL
 */
export function getInternalApiBaseUrl(): string {
  // In production, use /api/v1 to route to Fastify serverless function
  // This avoids conflicts with Next.js API routes at /api/*
  if (process.env.NODE_ENV === 'production') {
    // Use API_INTERNAL_URL if explicitly set (for separate API deployments)
    if (process.env.API_INTERNAL_URL) {
      console.log('[getInternalApiBaseUrl] Using API_INTERNAL_URL:', process.env.API_INTERNAL_URL);
      return process.env.API_INTERNAL_URL;
    }
    
    // Default: use /api/v1 path (routes to Fastify via vercel.json, avoids Next.js API routes)
    const baseUrl = '/api/v1';
    console.log('[getInternalApiBaseUrl] Production - returning:', baseUrl, {
      NODE_ENV: process.env.NODE_ENV,
      hasAPI_INTERNAL_URL: !!process.env.API_INTERNAL_URL,
    });
    return baseUrl;
  }

  // In development, use NEXT_PUBLIC_API_URL if set, otherwise default to localhost:4000
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (url.endsWith('/api')) {
      return url.slice(0, -4);
    }
    return url;
  }

  return 'http://localhost:4000';
}

/**
 * Get the full API URL for a specific endpoint
 * 
 * @param endpoint - API endpoint path (e.g., '/auth/login', '/projects')
 * @param options - Options for URL resolution
 * @param options.serverSide - If true, use internal API URL (for server-side requests)
 * @returns Full URL including base URL and endpoint
 */
export function getApiUrl(endpoint: string, options?: { serverSide?: boolean }): string {
  const baseUrl = options?.serverSide ? getInternalApiBaseUrl() : getApiBaseUrl();
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let url = `${baseUrl}${normalizedEndpoint}`;
  
  // In production, for server-side requests, we need an absolute URL for fetch()
  // But we want Vercel to route it internally. We'll use the Vercel URL or construct
  // from environment variables, ensuring it goes through Vercel's internal routing
  if (process.env.NODE_ENV === 'production' && url.startsWith('/') && options?.serverSide) {
    // Construct absolute URL using Vercel's internal routing
    // Use VERCEL_URL if available (set automatically by Vercel), otherwise use NEXT_PUBLIC_APP_URL
    let host: string;
    
    if (process.env.VERCEL_URL) {
      // VERCEL_URL is set by Vercel and represents the current deployment
      // Using it ensures requests stay within Vercel's internal network
      host = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_APP_URL) {
      // Fallback to NEXT_PUBLIC_APP_URL if VERCEL_URL is not available
      host = process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    } else {
      // Last resort - this should not happen in production
      console.warn('[getApiUrl] Neither VERCEL_URL nor NEXT_PUBLIC_APP_URL is set');
      throw new Error('VERCEL_URL or NEXT_PUBLIC_APP_URL must be set for server-side API calls in production');
    }
    
    url = `${host}${url}`;
  }
  
  return url;
}

