import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { Prisma } from '@prisma/client';
import type { ProjectSettings } from '@genie/shared';

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPlaceholderPages = (sourceUrl: string, maxPages: number) => {
  const baseUrl = new URL(sourceUrl);
  const candidates = [
    { key: 'SOURCE', title: 'Home' },
    { key: '/about', title: 'About' },
    { key: '/pricing', title: 'Pricing' },
    { key: '/contact', title: 'Contact' },
    { key: '/blog', title: 'Blog' }
  ];

  const limit = Math.max(1, Math.min(maxPages, candidates.length));
  const selected = candidates.slice(0, limit);

  return selected.map((item, index) => {
    const url =
      item.key === 'SOURCE'
        ? sourceUrl
        : new URL(item.key, `${baseUrl.protocol}//${baseUrl.host}`).toString();

    const title = index === 0 && baseUrl.pathname.length > 1 ? 'Landing Page' : item.title;

    return {
      url,
      title,
      metaDescription: `Auto-generated content summary for ${title.toLowerCase()}.`,
      htmlSnapshot: `<html><body><main><h1>${title}</h1><p>Generated snapshot for ${url}</p></main></body></html>`
    };
  });
};

const processPipelineJob = async (job: Job<ProjectPipelineJobData>) => {
  const { projectId, sourceUrl, settings } = job.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return;
  }

  const startedAt = job.timestamp ?? Date.now();
  const crawledPages = buildPlaceholderPages(sourceUrl, settings.maxPages ?? 10);

  try {
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'crawling' }
    });

    await prisma.crawlJob.updateMany({
      where: { projectId },
      data: {
        status: 'running',
        startedAt: new Date(startedAt),
        progress: 10,
        currentPage: sourceUrl,
        pagesDiscovered: 0
      }
    });

    await sleep(800);

    if (crawledPages.length > 0) {
      await prisma.page.createMany({
        data: crawledPages.map((page) => ({
          projectId,
          url: page.url,
          title: page.title,
          metaDescription: page.metaDescription,
          htmlSnapshot: page.htmlSnapshot
        })),
        skipDuplicates: true
      });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'analyzing',
        pageCount: crawledPages.length
      }
    });

    await prisma.crawlJob.updateMany({
      where: { projectId },
      data: {
        progress: 70,
        pagesDiscovered: crawledPages.length,
        currentPage: crawledPages.at(-1)?.url ?? sourceUrl
      }
    });

    await sleep(800);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'generating' }
    });

    await sleep(800);

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const fileCount = Math.max(1, crawledPages.length * 5);
    const totalSize = fileCount * 64_000;

    await prisma.crawlJob.updateMany({
      where: { projectId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        progress: 100,
        pagesDiscovered: crawledPages.length,
        currentPage: null
      }
    });

    await prisma.generation.create({
      data: {
        projectId,
        s3ZipPath: `s3://genie-placeholder/${projectId}.zip`,
        fileCount,
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

    await prisma.crawlJob.updateMany({
      where: { projectId },
      data: {
        status: 'failed',
        completedAt: new Date(),
        progress: 100,
        errors: errorPayload
      }
    }).catch(() => undefined);

    throw error;
  }
};

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
