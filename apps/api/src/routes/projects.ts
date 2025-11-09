import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod/v4';

import { enqueueProjectPipeline } from '../services/pipeline-queue.js';
import { serializeProject } from '../utils/serializers.js';

function getPhaseDescription(phase: string): string {
  switch (phase) {
    case 'queued':
      return 'Project is queued for processing';
    case 'extraction':
      return 'Crawling website and extracting content';
    case 'analysis':
      return 'Analyzing semantic content and design tokens';
    case 'selection':
      return 'AI matching content to optimal UI components';
    case 'generation':
      return 'Generating component-based Next.js project';
    case 'finalization':
      return 'Finalizing and packaging project';
    default:
      return 'Processing project';
  }
}

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
    return pages.map((p) => ({
      id: p.id,
      url: p.url,
      title: p.title,
      metaDescription: p.metaDescription,
      htmlSnapshot: p.htmlSnapshot,
      createdAt: p.createdAt
    }));
  });

  // get progress for a project (includes CrawlJob data and component-based pipeline info)
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

    // Calculate pipeline phase based on project status and crawl job progress
    let currentPhase: string;
    let phaseProgress: number;

    if (project.status === 'queued') {
      currentPhase = 'queued';
      phaseProgress = 0;
    } else if (project.status === 'crawling') {
      currentPhase = 'extraction';
      phaseProgress = Math.min(crawlJob?.progress || 0, 40); // Extraction is 0-40%
    } else if (project.status === 'analyzing') {
      currentPhase = 'analysis';
      phaseProgress = 40 + Math.min(Math.max((crawlJob?.progress || 0) - 40, 0), 30); // Analysis is 40-70%
    } else if (project.status === 'generating') {
      currentPhase = 'selection';
      phaseProgress = 70 + Math.min((crawlJob?.progress || 0) - 70, 25); // Selection is 70-95%
    } else if (project.status === 'completed') {
      currentPhase = 'finalization';
      phaseProgress = 100;
    } else {
      currentPhase = 'extraction';
      phaseProgress = 0;
    }

    return {
      project: serializeProject(project),
      pipeline: {
        currentPhase,
        phaseProgress,
        overallProgress: Math.min(phaseProgress, 100),
        phaseDescription: getPhaseDescription(currentPhase)
      },
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
        componentsMatched: generation?.fileCount ? Math.max(1, Math.floor(generation.fileCount / 5)) : 0, // Estimate component matches
        assetsOptimized: assets
      }
    };
  });

  // get download info for latest generation
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

    // Return generation stats even if ZIP isn't ready yet (s3ZipPath may be null)
    return {
      download: generation.s3ZipPath,
      fileCount: generation.fileCount,
      totalSize: generation.totalSize,
      zipReady: generation.s3ZipPath !== null
    };
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
