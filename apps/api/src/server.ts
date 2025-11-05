import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { fileURLToPath } from 'node:url';

import { env } from './env.js';

export const createServer = async () => {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty'
          }
        }
      : true
  });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(helmet, { global: true });

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
};

const isEntryPoint = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const entryFile = process.argv[1];
  return entryFile === currentFile;
};

if (isEntryPoint()) {
  const port = env.API_PORT;
  const host = env.API_HOST;

  createServer()
    .then(app => app.listen({ port, host }))
    .then(() => {
      console.log(`API running at http://${host}:${port}`);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
