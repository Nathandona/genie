import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

import { prisma } from '../db/prisma.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: typeof prisma;
  }
}

const prismaPlugin = async (fastify: FastifyInstance) => {
  fastify.decorate('db', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
};

export default fp(prismaPlugin);
