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
    
    // Extract path from request URL (remove /api prefix if present)
    const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
    let path = url.pathname;
    
    // Handle /api/v1/* routes (used to avoid NextAuth conflicts)
    // Strip both /api and /v1 prefixes before routing to Fastify
    if (path.startsWith('/api/v1/')) {
      path = path.replace('/api/v1', '');
    } else if (path.startsWith('/api/')) {
      // Regular /api/* routes - remove /api prefix
      path = path.replace('/api', '');
    }
    
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    // Build query string
    const queryString = url.search || '';
    const fullPath = path + queryString;
    
    // Prepare headers (remove host and connection headers that Fastify handles)
    const headers: Record<string, string> = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value && !['host', 'connection'].includes(key.toLowerCase())) {
        headers[key] = Array.isArray(value) ? value[0] : value;
      }
    });

    // Use Fastify's inject method to handle the request
    const response = await fastifyApp.inject({
      method: (req.method || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
      url: fullPath,
      headers,
      payload: req.body,
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


