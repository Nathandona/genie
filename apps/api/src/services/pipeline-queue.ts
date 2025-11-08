import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { Prisma } from '@prisma/client';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import archiver from 'archiver';
import type { ProjectSettings } from '@genie/shared';
import { SiteCrawler } from '@genie/crawler';
import { analyzeDesignTokens } from '@genie/analyzer';
import { generateNextJSProject } from '@genie/generator';

import { env } from '../env.js';
import { prisma } from '../db/prisma.js';

export interface ProjectPipelineJobData {
  projectId: string;
  userId: string;
  sourceUrl: string;
  settings: ProjectSettings;
}

const queueRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const pipelineQueue = new Queue<ProjectPipelineJobData>('project-pipeline', {
  connection: queueRedis,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1_000
    }
  }
});

pipelineQueue.on('error', (error) => {
  if (env.NODE_ENV !== 'test') {
    console.error('Pipeline queue error', error);
  }
});

export const enqueueProjectPipeline = async (data: ProjectPipelineJobData) => {
  await pipelineQueue.add('project-pipeline', data);
};

const workerRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const processPipelineJob = async (job: Job<ProjectPipelineJobData>) => {
  const { projectId, sourceUrl, settings } = job.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return;
  }

  const startedAt = job.timestamp ?? Date.now();
  const crawler = new SiteCrawler();

  try {
    // Update status to crawling
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'crawling' }
    });

    const crawlJob = await prisma.crawlJob.findFirst({
      where: { projectId },
      orderBy: { id: 'desc' }
    });

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'running',
          startedAt: new Date(startedAt),
          progress: 0,
          currentPage: sourceUrl,
          pagesDiscovered: 0
        }
      });
    }

    // Crawl the website (optimized: use domcontentloaded for faster crawling)
    const crawlResult = await crawler.crawl({
      projectId,
      startUrl: sourceUrl,
      settings,
      maxConcurrency: 2,
      waitStrategy: 'domcontentloaded', // Faster than networkidle0
      onProgress: async (progress: { currentPage: string; pagesDiscovered: number; progress: number }) => {
        if (crawlJob) {
          await prisma.crawlJob.update({
            where: { id: crawlJob.id },
            data: {
              progress: Math.min(progress.progress, 50), // Crawling is 0-50%
              currentPage: progress.currentPage,
              pagesDiscovered: progress.pagesDiscovered
            }
          });
        }
      }
    });

    // Store crawled pages
    if (crawlResult.pages.length > 0) {
      await prisma.page.createMany({
        data: crawlResult.pages.map((page: { url: string; html: string; title?: string; metaDescription?: string }) => ({
          projectId,
          url: page.url,
          title: page.title,
          metaDescription: page.metaDescription,
          htmlSnapshot: page.html
        })),
        skipDuplicates: true
      });
    }

    // Update status to analyzing
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'analyzing',
        pageCount: crawlResult.pages.length
      }
    });

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          progress: 60,
          pagesDiscovered: crawlResult.pages.length,
          currentPage: crawlResult.pages.at(-1)?.url ?? sourceUrl
        }
      });
    }

    // Analyze design tokens from all pages in parallel
    const allDesignTokens = {
      colors: new Set<string>(),
      fonts: new Set<string>(),
      spacingScale: new Set<number>(),
      borderRadius: new Set<number>(),
      shadows: new Set<string>(),
      requiredComponents: new Set<string>()
    };

    // Parallel token extraction for faster processing
    const tokenResults = await Promise.all(
      crawlResult.pages.map((page) => analyzeDesignTokens({ html: page.html }))
    );

    // Combine all tokens
    for (const tokens of tokenResults) {
      tokens.colors.forEach((c: string) => allDesignTokens.colors.add(c));
      tokens.fonts.forEach((f: string) => allDesignTokens.fonts.add(f));
      tokens.spacingScale.forEach((s: number) => allDesignTokens.spacingScale.add(s));
      if (tokens.borderRadius) {
        tokens.borderRadius.forEach((b: number) => allDesignTokens.borderRadius.add(b));
      }
      if (tokens.shadows) {
        tokens.shadows.forEach((sh: string) => allDesignTokens.shadows.add(sh));
      }
      if (tokens.requiredComponents) {
        tokens.requiredComponents.forEach((c: string) => allDesignTokens.requiredComponents.add(c));
      }
    }

    const combinedTokens = {
      colors: Array.from(allDesignTokens.colors).slice(0, 12),
      fonts: Array.from(allDesignTokens.fonts),
      spacingScale: Array.from(allDesignTokens.spacingScale).sort((a, b) => a - b),
      borderRadius: Array.from(allDesignTokens.borderRadius).sort((a, b) => a - b),
      shadows: Array.from(allDesignTokens.shadows).slice(0, 10),
      requiredComponents: Array.from(allDesignTokens.requiredComponents)
    };

    // Update pages with design tokens
    for (const page of crawlResult.pages) {
      const pageRecord = await prisma.page.findFirst({
        where: { projectId, url: page.url }
      });
      if (pageRecord) {
        await prisma.page.update({
          where: { id: pageRecord.id },
          data: {
            designTokens: combinedTokens as Prisma.JsonObject
          }
        });
      }
    }

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: { progress: 80 }
      });
    }

    // Update status to generating
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'generating' }
    });

    // Generate Next.js project
    const projectName = new URL(sourceUrl).hostname.replace('www.', '');
    const outputDir = join(tmpdir(), `genie-${projectId}`);
    
    const pagesForGeneration = crawlResult.pages.map((page: { url: string; title?: string; html: string }) => {
      const urlObj = new URL(page.url);
      const path = urlObj.pathname === '/' ? '/' : urlObj.pathname;
      return {
        url: page.url,
        title: page.title,
        html: page.html,
        path
      };
    });

    const generationResult = await generateNextJSProject({
      outputDir,
      projectName,
      pages: pagesForGeneration,
      designTokens: combinedTokens
    });

    // Create ZIP file (optimized streaming)
    const zipPath = join(tmpdir(), `genie-${projectId}.zip`);
    await createZipArchive(outputDir, zipPath);

    // Calculate file size
    const { statSync } = await import('node:fs');
    const totalSize = statSync(zipPath).size;

    // Cleanup temp directory after ZIP creation (optimized: free disk space)
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.warn(`Failed to cleanup temp directory ${outputDir}:`, cleanupError);
    }

    // In production, upload to S3 here
    // For now, store the actual local file path so downloads work
    // Format: file:///tmp/genie-{projectId}.zip (we'll parse this in the download endpoint)
    const s3ZipPath = `file://${zipPath}`;

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          progress: 100,
          pagesDiscovered: crawlResult.pages.length,
          currentPage: null,
          errors: crawlResult.errors.length > 0 ? crawlResult.errors as Prisma.JsonArray : undefined
        }
      });
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));

    await prisma.generation.create({
      data: {
        projectId,
        s3ZipPath,
        fileCount: generationResult.fileCount,
        totalSize
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'completed',
        generationTime: elapsedSeconds,
        completedAt: new Date()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown pipeline error';
    const errorPayload: Prisma.JsonArray = [message];

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'failed',
        completedAt: new Date()
      }
    }).catch(() => undefined);

    const crawlJob = await prisma.crawlJob.findFirst({
      where: { projectId },
      orderBy: { startedAt: 'desc' }
    });

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          progress: 100,
          errors: errorPayload
        }
      }).catch(() => undefined);
    }

    throw error;
  } finally {
    await crawler.close();
  }
};

async function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    // Optimized: Use level 6 for better speed/size balance (level 9 is too slow)
    const archive = archiver('zip', { 
      zlib: { level: 6 },
      store: false // Use compression
    });

    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));
    archive.on('warning', (err: Error & { code?: string }) => {
      // Log warnings but don't fail
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err.message);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

export const pipelineWorker = new Worker<ProjectPipelineJobData>('project-pipeline', processPipelineJob, {
  connection: workerRedis
});

pipelineWorker.on('error', (error) => {
  if (env.NODE_ENV !== 'test') {
    console.error('Pipeline worker error', error);
  }
});

pipelineWorker.on('failed', (job, error) => {
  if (env.NODE_ENV !== 'test') {
    console.error(`Pipeline job ${job?.id ?? 'unknown'} failed`, error);
  }
});
