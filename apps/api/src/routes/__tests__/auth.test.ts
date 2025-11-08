import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import authRoutes from '../auth.js';
import { createTestApp, createAuthHeaders, createMockPrisma, createMockJwt } from './test-helper.js';
import argon2 from 'argon2';
import { getUsagePeriod } from '../../utils/date.js';

// Mock argon2
vi.mock('argon2', () => ({
  default: {
    hash: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('Auth API Routes', () => {
  let app: FastifyInstance;
  const mockUserId = 'user-123';
  const mockEmail = 'test@example.com';
  const mockPassword = 'password123';
  const mockDb = createMockPrisma();
  const mockJwt = createMockJwt();

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createTestApp(authRoutes, { mockDb, mockJwt });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(null); // User doesn't exist
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      mockDb.user.create.mockResolvedValue(mockUser as any);
      mockDb.usage.upsert.mockResolvedValue({ id: 'usage-123' } as any);
      mockJwt.sign.mockReturnValue('mock-token-123');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: mockEmail,
          password: mockPassword,
          name: 'Test User',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.token).toBeDefined();
      expect(body.user.id).toBe(mockUserId);
      expect(body.user.email).toBe(mockEmail.toLowerCase());
      expect(mockDb.user.create).toHaveBeenCalled();
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: null,
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(null);
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      mockDb.user.create.mockResolvedValue(mockUser as any);
      mockDb.usage.upsert.mockResolvedValue({ id: 'usage-123' } as any);
      mockJwt.sign.mockReturnValue('mock-token-123');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'TEST@EXAMPLE.COM',
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockEmail.toLowerCase(),
        }),
      });
    });

    it('should return 409 if email already exists', async () => {
      const existingUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: null,
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(existingUser as any);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: mockEmail,
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Email already registered');
      expect(mockDb.user.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: 'invalid-email',
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate password length', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: mockEmail,
          password: 'short',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should create usage record on signup', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: null,
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(null);
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      mockDb.user.create.mockResolvedValue(mockUser as any);
      mockDb.usage.upsert.mockResolvedValue({ id: 'usage-123' } as any);
      mockJwt.sign.mockReturnValue('mock-token-123');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/signup',
        payload: {
          email: mockEmail,
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockDb.usage.upsert).toHaveBeenCalledWith({
        where: {
          userId_period: {
            userId: mockUserId,
            period: getUsagePeriod(),
          },
        },
        update: {},
        create: {
          userId: mockUserId,
          period: getUsagePeriod(),
        },
      });
    });
  });

  describe('POST /auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(mockUser as any);
      vi.mocked(argon2.verify).mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-token-123');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: mockEmail,
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.token).toBeDefined();
      expect(body.user.id).toBe(mockUserId);
      expect(mockJwt.sign).toHaveBeenCalled();
    });

    it('should return 401 for invalid email', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: null,
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(mockUser as any);
      vi.mocked(argon2.verify).mockResolvedValue(false);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: mockEmail,
          password: 'wrong-password',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid credentials');
    });

    it('should normalize email to lowercase', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: null,
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(mockUser as any);
      vi.mocked(argon2.verify).mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mock-token-123');

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'TEST@EXAMPLE.COM',
          password: mockPassword,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockEmail.toLowerCase() },
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout authenticated user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(204);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /auth/session', () => {
    it('should return current user session', async () => {
      const mockUser = {
        id: mockUserId,
        email: mockEmail.toLowerCase(),
        passwordHash: 'hashed-password',
        name: 'Test User',
        role: 'user',
        subscription: 'free',
        stripeCustomerId: null,
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.user.findUnique.mockResolvedValue(mockUser as any);

      const response = await app.inject({
        method: 'GET',
        url: '/auth/session',
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.user.id).toBe(mockUserId);
      expect(body.user.email).toBe(mockEmail.toLowerCase());
      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/auth/session',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should throw error if user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/auth/session',
        headers: createAuthHeaders(mockUserId),
      });

      // Fastify will return 500 for unhandled errors
      expect(response.statusCode).toBe(500);
    });
  });
});

