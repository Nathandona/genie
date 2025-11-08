import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { enqueueProjectPipeline } from '../services/pipeline-queue.js';
import { serializeProject } from '../utils/serializers.js';
import { startPreview, stopPreview, getPreviewStatus } from '../services/preview-service.js';

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
    return pages.map(p => ({
      id: p.id,
      url: p.url,
      title: p.title,
      metaDescription: p.metaDescription,
      htmlSnapshot: p.htmlSnapshot,
      createdAt: p.createdAt
    }));
  });

  // get progress for a project (includes CrawlJob data)
  server.get('/projects/:id/progress', {
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

    // Get latest crawl job (order by id desc to get most recent)
    const crawlJob = await server.db.crawlJob.findFirst({
      where: { projectId: id },
      orderBy: { id: 'desc' }                                                                                                                                                         
    });

    // Get real stats
    const pages = await server.db.page.count({ where: { projectId: id } });
    const assets = await server.db.asset.count({ where: { projectId: id } });                                                   
    const generation = await server.db.generation.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    return {
      project: serializeProject(project),
      crawlJob: crawlJob ? {
        id: crawlJob.id,
        status: crawlJob.status,
        progress: crawlJob.progress,
        currentPage: crawlJob.currentPage,
        pagesDiscovered: crawlJob.pagesDiscovered,
        startedAt: crawlJob.startedAt,
        completedAt: crawlJob.completedAt,
        errors: crawlJob.errors
      } : null,
      stats: {
        pagesDiscovered: pages,
        componentsCreated: generation?.fileCount ? Math.floor(generation.fileCount / 10) : 0, // Estimate from file count
        assetsOptimized: assets
      }
    };
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

  // download project ZIP file
  server.get('/projects/:id/download/file', {
    preHandler: server.authenticate,
    schema: {
      params: z.object({ id: z.string().uuid() }),
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const { id } = request.params as { id: string };
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    const generation = await server.db.generation.findFirst({ 
      where: { projectId: id }, 
      orderBy: { createdAt: 'desc' } 
    });
    if (!generation) {
      return reply.status(404).send({ message: 'No generation available' });
    }

    // Get the local ZIP file path
    // The s3ZipPath field stores either:
    // - file:///path/to/file.zip (local file path)
    // - s3://bucket/path/to/file.zip (S3 path for future implementation)
    const { existsSync, createReadStream } = await import('node:fs');
    let zipPath: string;
    
    if (generation.s3ZipPath.startsWith('file://')) {
      // Extract local file path
      zipPath = generation.s3ZipPath.replace('file://', '');
    } else if (generation.s3ZipPath.startsWith('s3://')) {
      // Future: Handle S3 downloads here
      return reply.status(501).send({ message: 'S3 downloads not yet implemented' });
    } else {
      // Fallback: try tmpdir pattern (for backwards compatibility)
      const { join } = await import('node:path');
      const { tmpdir } = await import('node:os');
      zipPath = join(tmpdir(), `genie-${id}.zip`);
    }

    // Check if file exists
    if (!existsSync(zipPath)) {
      return reply.status(404).send({ message: 'ZIP file not found. It may have been cleaned up.' });
    }

    // Update download count
    await server.db.generation.update({
      where: { id: generation.id },
      data: { downloadCount: { increment: 1 } }
    }).catch(() => {
      // Don't fail if update fails
    });

    // Get project name for download filename
    const projectName = project.sourceUrl ? new URL(project.sourceUrl).hostname.replace('www.', '') : 'project';
    const filename = `${projectName}-${id.slice(0, 8)}.zip`;

    // Stream the file
    reply.header('Content-Type', 'application/zip');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(createReadStream(zipPath));
  });

  // start preview server for a project
  server.post('/projects/:id/preview/start', {
    preHandler: server.authenticate,
    schema: {
      params: projectIdParamsSchema,
      response: { 200: z.object({ url: z.string(), port: z.number() }) },
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const { id } = projectIdParamsSchema.parse(request.params);
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    const generation = await server.db.generation.findFirst({ 
      where: { projectId: id }, 
      orderBy: { createdAt: 'desc' } 
    });
    if (!generation) {
      return reply.status(404).send({ message: 'No generation available' });
    }

    // Get ZIP file path
    const { existsSync } = await import('node:fs');
    let zipPath: string;
    
    if (generation.s3ZipPath.startsWith('file://')) {
      zipPath = generation.s3ZipPath.replace('file://', '');
    } else if (generation.s3ZipPath.startsWith('s3://')) {
      return reply.status(501).send({ message: 'S3 previews not yet implemented' });
    } else {
      const { join } = await import('node:path');
      const { tmpdir } = await import('node:os');
      zipPath = join(tmpdir(), `genie-${id}.zip`);
    }

    if (!existsSync(zipPath)) {
      return reply.status(404).send({ message: 'ZIP file not found' });
    }

    try {
      const preview = await startPreview(id, zipPath);
      return preview;
    } catch (error) {
      return reply.status(500).send({ 
        message: `Failed to start preview: ${(error as Error).message}` 
      });
    }
  });

  // stop preview server for a project
  server.post('/projects/:id/preview/stop', {
    preHandler: server.authenticate,
    schema: {
      params: projectIdParamsSchema,
      response: { 200: z.object({ message: z.string() }) },
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const { id } = projectIdParamsSchema.parse(request.params);
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    try {
      await stopPreview(id);
      return { message: 'Preview stopped' };
    } catch (error) {
      return reply.status(500).send({ 
        message: `Failed to stop preview: ${(error as Error).message}` 
      });
    }
  });

  // get preview status for a project
  server.get('/projects/:id/preview', {
    preHandler: server.authenticate,
    schema: {
      params: projectIdParamsSchema,
      response: { 
        200: z.object({ 
          url: z.string(), 
          port: z.number(), 
          startedAt: z.string() 
        }).nullable() 
      },
      tags: ['projects']
    }
  }, async (request, reply) => {
    const userId = request.user.sub;
    const { id } = projectIdParamsSchema.parse(request.params);
    const project = await server.db.project.findUnique({ where: { id } });
    if (!project || project.userId !== userId) {
      return reply.status(404).send({ message: 'Project not found' });
    }

    const status = getPreviewStatus(id);
    if (!status) {
      return null;
    }

    return {
      url: status.url,
      port: status.port,
      startedAt: status.startedAt.toISOString(),
    };
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
