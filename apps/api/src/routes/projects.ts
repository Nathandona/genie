import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { enqueueProjectPipeline } from '../services/pipeline-queue.js';
import { serializeProject } from '../utils/serializers.js';

const createProjectSchema = z.object({
  sourceUrl: z.string().url(),
  settings: z.object({
    maxPages: z.number().int().min(1).max(500),
    includePatterns: z.array(z.string()).optional(),
    excludePatterns: z.array(z.string()).optional()
  }).optional().default({ maxPages: 10 })
});

const projectIdParamsSchema = z.object({ id: z.string().uuid() });

export default async function projectRoutes(app: FastifyInstance) {
  const server = app.withTypeProvider<ZodTypeProvider>();

  // create project
  server.post('/projects', {
    preHandler: server.authenticate,
    schema: {
      body: createProjectSchema,
      response: {
        201: z.any()
      },
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const payload = createProjectSchema.parse(request.body);

    // Ensure maxPages has a value
    const settings = {
      maxPages: payload.settings?.maxPages ?? 10,
      includePatterns: payload.settings?.includePatterns,
      excludePatterns: payload.settings?.excludePatterns,
    };

    // store project
    const project = await server.db.project.create({
      data: {
        userId,
        sourceUrl: payload.sourceUrl,
        settings: settings
      }
    });

    // create initial crawl job
    await server.db.crawlJob.create({
      data: {
        projectId: project.id,
        status: 'pending',
        progress: 0
      }
    });

    // enqueue pipeline job
    await enqueueProjectPipeline({
      projectId: project.id,
      userId,
      sourceUrl: payload.sourceUrl,
      settings: settings
    });

    return reply.status(201).send(serializeProject(project));
  });

  server.get('/projects', {
    preHandler: server.authenticate,
    schema: {
      response: {
        200: z.array(z.any())
      },
      tags: ['projects']
    }
  }, async (request) => {
  const userId = request.user.sub;
  const projects = await server.db.project.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return projects.map(serializeProject);
  });

  server.get('/projects/:id', {
    preHandler: server.authenticate,
    schema: {
  params: projectIdParamsSchema,
      response: { 200: z.any() },
      tags: ['projects']
    }
  }, async (request, reply) => {
  const userId = request.user.sub;
  const { id } = projectIdParamsSchema.parse(request.params);
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return reply.status(404).send({ message: 'Project not found' });
    }
    return serializeProject(project);
  });

  // list pages for a project
  server.get('/projects/:id/pages', {
    preHandler: server.authenticate,
    schema: {
  params: projectIdParamsSchema,
      response: { 200: z.array(z.any()) },
      tags: ['projects']
    }
  }, async (request, reply) => {
  const userId = request.user.sub;
  const { id } = projectIdParamsSchema.parse(request.params);
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) return reply.status(404).send({ message: 'Project not found' });

    const pages = await server.db.page.findMany({ where: { projectId: id }, orderBy: { createdAt: 'asc' } });
    return pages.map(p => ({ id: p.id, url: p.url, title: p.title, metaDescription: p.metaDescription, createdAt: p.createdAt }));
  });

  // get download link for latest generation
  server.get('/projects/:id/download', {
    preHandler: server.authenticate,
    schema: {
      params: z.object({ id: z.string().uuid() }),
      response: { 200: z.any() },
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const { id } = request.params as { id: string };
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) return reply.status(404).send({ message: 'Project not found' });

    const generation = await server.db.generation.findFirst({ where: { projectId: id }, orderBy: { createdAt: 'desc' } });
    if (!generation) return reply.status(404).send({ message: 'No generation available' });

    // For now return the s3 path as the download link (frontend will request signed url from S3 integration)
    return { download: generation.s3ZipPath, fileCount: generation.fileCount, totalSize: generation.totalSize };
  });

  // delete project
  server.delete('/projects/:id', {
    preHandler: server.authenticate,
    schema: {
      params: projectIdParamsSchema,
      response: { 204: z.any() },
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const { id } = projectIdParamsSchema.parse(request.params);
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    // Delete related records (cascade should handle this, but being explicit)
    await server.db.generation.deleteMany({ where: { projectId: id } });
    await server.db.page.deleteMany({ where: { projectId: id } });
    await server.db.crawlJob.deleteMany({ where: { projectId: id } });
    await server.db.project.delete({ where: { id } });

    return reply.status(204).send();
  });
}
