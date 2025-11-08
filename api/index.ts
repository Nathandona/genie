import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createServer } from '../apps/api/src/server.js';

// Reuse server instance across invocations (cold start optimization)
let app: Awaited<ReturnType<typeof createServer>> | null = null;

async function getApp() {
  if (!app) {
    app = await createServer();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const fastifyApp = await getApp();
    
    // Extract path from request URL
    // When Vercel rewrites /api/v1/* to /api, req.url should contain the original path
    // For example: /api/v1/auth/login -> req.url = /api/v1/auth/login
    const originalUrl = req.url || '/';
    const url = new URL(originalUrl, `https://${req.headers.host || 'localhost'}`);
    let path = url.pathname;
    
    // Log incoming request for debugging
    console.log('[Serverless] Incoming request:', {
      method: req.method,
      path: path,
      url: req.url,
      query: req.query,
      headers: {
        'x-vercel-rewrite': req.headers['x-vercel-rewrite'],
        'x-incoming-url': req.headers['x-incoming-url'],
        'x-vercel-original-path': req.headers['x-vercel-original-path'],
      },
      hasBody: !!req.body
    });
    
    // Handle /api/v1/* routes (used to avoid NextAuth conflicts)
    // Strip both /api and /v1 prefixes before routing to Fastify
    if (path.startsWith('/api/v1/')) {
      path = path.replace('/api/v1', '');
    } else if (path.startsWith('/api/')) {
      // Regular /api/* routes - remove /api prefix
      path = path.replace('/api', '');
    } else if (path === '/api' || path === '/api/') {
      // If path is exactly /api (from rewrite), the original path should be in req.url
      // But if it's not, check query params or headers
      const originalPath = (req.query.path as string) || req.headers['x-vercel-original-path'] as string;
      if (originalPath) {
        path = originalPath.startsWith('/api/v1/') 
          ? originalPath.replace('/api/v1', '')
          : originalPath.startsWith('/api/')
          ? originalPath.replace('/api', '')
          : originalPath;
      } else {
        // Fallback to root if we can't determine the path
        path = '/';
      }
    }
    
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Build query string
    const queryString = url.search || '';
    const fullPath = path + queryString;
    
    console.log('[Serverless] Routing to Fastify:', {
      originalPath: url.pathname,
      fastifyPath: fullPath,
      method: req.method
    });
    
    // Prepare headers (remove host and connection headers that Fastify handles)
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value && !['host', 'connection'].includes(key.toLowerCase())) {
        headers[key] = Array.isArray(value) ? value[0] : value;
      }
    });

    // Handle request body - Vercel may have already parsed JSON, Fastify inject accepts objects
    let payload: any = req.body;
    if (payload && typeof payload === 'object' && !Buffer.isBuffer(payload)) {
      // If it's already an object, Fastify inject can handle it directly
      // But for JSON content-type, we should stringify it
      if (headers['content-type']?.includes('application/json')) {
        payload = JSON.stringify(payload);
      }
    }

    // Use Fastify's inject method to handle the request
    const response = await fastifyApp.inject({
      method: (req.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
      url: fullPath,
      headers,
      payload,
      query: req.query as Record<string, string>,
    });

    // Set response headers
    Object.entries(response.headers).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        res.setHeader(key, String(value));
      }
    });

    // Handle cookies from Fastify response
    const cookies = (response as any).cookies;
    if (cookies && Array.isArray(cookies) && cookies.length > 0) {
      cookies.forEach((cookie: any) => {
        if (cookie && cookie.name && cookie.value) {
          const cookieStr = `${cookie.name}=${cookie.value}${cookie.options ? `; ${cookie.options}` : ''}`;
          res.setHeader('Set-Cookie', cookieStr);
        }
      });
    }

    // Send response with appropriate status code
    res.status(response.statusCode);
    
    // Handle different content types
    const contentType = String(response.headers['content-type'] || '');
    if (contentType.includes('application/json')) {
      try {
        const json = typeof response.payload === 'string' ? JSON.parse(response.payload) : response.payload;
        res.json(json);
      } catch {
        res.send(response.payload);
      }
    } else if (contentType.includes('application/zip') || contentType.includes('application/octet-stream')) {
      // For binary data, send as buffer
      const payload = (response as any).rawPayload || response.payload;
      if (Buffer.isBuffer(payload)) {
        res.send(payload);
      } else {
        res.send(Buffer.from(String(payload)));
      }
    } else {
      res.send(response.payload);
    }
  } catch (error) {
    console.error('Serverless function error:', error);
    const statusCode = error instanceof Error && 'statusCode' in error 
      ? (error as any).statusCode 
      : 500;
    res.status(statusCode).json({
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}


