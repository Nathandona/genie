import argon2 from 'argon2';
import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { serializeUser } from '../utils/serializers.js';
import { getUsagePeriod } from '../utils/date.js';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

const signupSchema = credentialsSchema.extend({
  name: z.string().min(1).max(120).optional()
});

const sessionResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    avatarUrl: z.string().url().nullable().optional(),
    role: z.string(),
    subscription: z.string(),
    stripeCustomerId: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date()
  })
});

export default async function authRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  server.post(
    '/auth/signup',
    {
      schema: {
        body: signupSchema,
        response: {
          201: z.object({
            token: z.string(),
            user: sessionResponseSchema.shape.user
          })
        },
        tags: ['auth']
      }
    },
    async (request, reply) => {
      const { email, password, name } = signupSchema.parse(request.body);
      const normalizedEmail = email.toLowerCase();

      const existingUser = await server.db.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingUser) {
        return reply.status(409).send({ message: 'Email already registered' });
      }

      const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

      const user = await server.db.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name
        }
      });

      const period = getUsagePeriod();
      await server.db.usage.upsert({
        where: { userId_period: { userId: user.id, period } },
        update: {},
        create: {
          userId: user.id,
          period
        }
      });

      const token = server.jwt.sign({ sub: user.id, email: user.email });

      return reply.status(201).send({ token, user: serializeUser(user) });
    }
  );

  server.post(
    '/auth/login',
    {
      schema: {
        body: credentialsSchema,
        response: {
          200: z.object({
            token: z.string(),
            user: sessionResponseSchema.shape.user
          })
        },
        tags: ['auth']
      }
    },
    async (request, reply) => {
      const { email, password } = credentialsSchema.parse(request.body);
      const normalizedEmail = email.toLowerCase();

      const user = await server.db.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      const valid = await argon2.verify(user.passwordHash, password);
      if (!valid) {
        return reply.status(401).send({ message: 'Invalid credentials' });
      }

      const token = server.jwt.sign({ sub: user.id, email: user.email });
      return reply.send({ token, user: serializeUser(user) });
    }
  );

  server.post(
    '/auth/logout',
    {
      preHandler: server.authenticate,
      schema: {
        tags: ['auth']
      }
    },
    async (_request, reply) => {
      return reply.status(204).send();
    }
  );

  server.get(
    '/auth/session',
    {
      preHandler: server.authenticate,
      schema: {
        response: {
          200: sessionResponseSchema
        },
        tags: ['auth']
      }
    },
    async (request) => {
      const userId = request.user.sub;
      const user = await server.db.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw new Error('User not found');
      }

      return { user: serializeUser(user) };
    }
  );
}
