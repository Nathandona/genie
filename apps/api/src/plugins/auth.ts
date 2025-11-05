import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { env } from '../env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string };
    user: { sub: string; email: string };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user: { sub: string; email: string };
  }
}

const authPlugin = async (fastify: FastifyInstance) => {
  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: '7d'
    }
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({ message: 'Unauthorized' });
    }
  });
};

export default fp(authPlugin);
