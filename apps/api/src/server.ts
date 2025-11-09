import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { fileURLToPath } from 'node:url';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';

import { env } from './env.js';
import prismaPlugin from './plugins/prisma.js';
import authPlugin from './plugins/auth.js';
import polarPlugin from './plugins/polar.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import polarRoutes from './routes/polar.js';
// Import pipeline queue to initialize the worker
import './services/pipeline-queue.js';

export const createServer = async () => {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty'
          }
        }
      : true
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Configure CORS
  // In production, use WEB_APP_ORIGIN if set, otherwise allow all origins
  // In development, allow all origins for easier local development
  const corsOrigin = env.NODE_ENV === 'production' && env.WEB_APP_ORIGIN
    ? [env.WEB_APP_ORIGIN]
    : true; // Allow all origins

  await app.register(cors, { 
    origin: corsOrigin,
    credentials: true 
  });
  await app.register(helmet, { global: true });

  // register plugins
  await app.register(prismaPlugin);
  await app.register(authPlugin);
  await app.register(polarPlugin);
  // register routes
  await app.register(authRoutes);
  await app.register(projectRoutes);
  await app.register(polarRoutes);

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
};

const isEntryPoint = () => {
  const currentFile = fileURLToPath(import.meta.url);
  const entryFile = process.argv[1];
  return entryFile === currentFile;
};

if (isEntryPoint()) {
  const port = env.API_PORT ?? 4000;
  const host = env.API_HOST ?? '0.0.0.0';

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
