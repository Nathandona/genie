/**
 * Server-side API client for calling the Fastify backend
 * 
 * This client is used by Next.js API routes and middleware to communicate
 * with the Fastify backend via HTTP. It handles:
 * - URL resolution (dev vs production)
 * - Cookie propagation
 * - Error handling
 * - Response parsing
 */

import { getApiUrl } from './api-url';

export interface AuthSignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    role: string;
    subscription: string;
    stripeCustomerId?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    role: string;
    subscription: string;
    stripeCustomerId?: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

/**
 * Make a request to the Fastify backend
 */
async function request<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    token?: string;
  } = {}
): Promise<{ data: T; statusCode: number }> {
  const { method = 'GET', body, headers = {}, token } = options;

  // Build request headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Add internal request header for Vercel routing (if using /api/* instead of /api/v1/*)
  // This helps Vercel route to the serverless function instead of Next.js API routes
  if (process.env.NODE_ENV === 'production') {
    requestHeaders['x-internal-request'] = 'true';
  }

  // Get the API URL - use serverSide flag for server-side requests
  const url = getApiUrl(endpoint, { serverSide: true });

  // Log request URL for debugging (especially in production)
  console.log(`[Server API Client] ${method} ${url}`, {
    endpoint,
    serverSide: true,
    hasBody: !!body,
    hasToken: !!token,
    nodeEnv: process.env.NODE_ENV,
  });

  // Make the request
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', // Always fetch fresh data
  });

  // Parse response
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data: T;
  if (isJson) {
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch (error) {
        console.error('[Server API Client] Failed to parse JSON response:', {
          url,
          status: response.status,
          contentType,
          bodyPreview: text.substring(0, 200),
        });
        throw new Error('Invalid JSON response from backend');
      }
    } else {
      // Empty response
      data = undefined as T;
    }
  } else {
    // Non-JSON response
    const text = await response.text();
    console.error('[Server API Client] Non-JSON response:', {
      url,
      status: response.status,
      contentType,
      bodyPreview: text.substring(0, 200),
    });
    throw new Error('Backend returned non-JSON response');
  }

  // Check for errors
  if (!response.ok) {
    const error = data as unknown as ApiError;
    throw {
      message: error.message || `Request failed with status ${response.status}`,
      statusCode: response.status,
    } as ApiError;
  }

  return { data, statusCode: response.status };
}

/**
 * Sign up a new user
 */
export async function authSignup(
  payload: AuthSignupRequest
): Promise<AuthResponse> {
  const { data } = await request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: payload,
  });
  return data;
}

/**
 * Log in a user
 */
export async function authLogin(
  payload: AuthLoginRequest
): Promise<AuthResponse> {
  const { data } = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
  return data;
}

/**
 * Get the current session
 */
export async function authSession(
  token: string
): Promise<SessionResponse> {
  const { data } = await request<SessionResponse>('/auth/session', {
    method: 'GET',
    token,
  });
  return data;
}

