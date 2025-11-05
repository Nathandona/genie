import { PrismaClient } from '@prisma/client';

import { env } from '../env.js';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const createPrismaClient = () =>
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

export const prisma: PrismaClient = global.__prismaClient ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}
