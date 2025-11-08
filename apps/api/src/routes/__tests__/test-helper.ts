import Fastify from 'fastify';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

// Mock Prisma Client
export const createMockPrisma = () => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  project: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  crawlJob: {
    create: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  page: {
    findMany: vi.fn(),
    count: vi.fn(),
    deleteMany: vi.fn(),
  },
  asset: {
    count: vi.fn(),
  },
  generation: {
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  usage: {
    upsert: vi.fn(),
  },
  $disconnect: vi.fn(),
});

// Mock JWT
export const createMockJwt = () => ({
  sign: vi.fn((payload: { sub: string; email: string }) => `mock-token-${payload.sub}`),
  verify: vi.fn(),
});

// Mock Polar SDK
export const createMockPolar = () => ({
  products: {
    list: vi.fn(),
  },
  checkouts: {
    create: vi.fn(),
  },
  subscriptions: {
    list: vi.fn(),
    update: vi.fn(),
  },
});

export interface TestAppOptions {
  mockDb?: ReturnType<typeof createMockPrisma>;
  mockJwt?: ReturnType<typeof createMockJwt>;
  mockPolar?: ReturnType<typeof createMockPolar>;
}

export const createTestApp = async (
  registerRoutes: (app: FastifyInstance) => Promise<void> | void,
  options: TestAppOptions = {}
): Promise<FastifyInstance> => {
  const mockDb = options.mockDb || createMockPrisma();
  const mockJwt = options.mockJwt || createMockJwt();
  const mockPolar = options.mockPolar || createMockPolar();

  const app = Fastify({
    logger: false,
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Decorate with mocks BEFORE registering routes
  app.decorate('db', mockDb as unknown as PrismaClient);
  app.decorate('jwt', mockJwt);
  app.decorate('polar', mockPolar);
  
  // Add error handler to catch and format errors
  app.setErrorHandler((error, request, reply) => {
    // Don't log in tests to avoid noise
    const statusCode = error.statusCode || 500;
    
    // If the route already sent a response, don't override it
    if (reply.sent) {
      return;
    }
    
    // Preserve error structure from route handlers
    if (error.validation) {
      return reply.status(400).send({
        message: 'Validation error',
        errors: error.validation,
      });
    }
    
    // If error already has a formatted response structure, use it
    if (error.message && statusCode !== 500) {
      return reply.status(statusCode).send({
        message: error.message,
      });
    }
    
    // Default error response
    reply.status(statusCode).send({
      error: error.message || 'Internal Server Error',
    });
  });

  // Mock authenticate decorator
  app.decorate('authenticate', async (request: any, reply: any) => {
    // Mock authentication - verify token exists
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
    // Extract user from token (in real app, this would verify JWT)
    const token = authHeader.replace('Bearer ', '');
    if (token.startsWith('mock-token-')) {
      const userId = token.replace('mock-token-', '');
      request.user = { sub: userId, email: `${userId}@test.com` };
    } else {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
  });

  // Register routes
  await registerRoutes(app);

  // Ready the app
  await app.ready();

  return app;
};

export const createAuthHeaders = (userId: string = 'user-123') => ({
  authorization: `Bearer mock-token-${userId}`,
});

