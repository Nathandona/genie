import { Queue, Worker, type Job } from 'bullmq';
import { Redis } from 'ioredis';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import archiver from 'archiver';
import type { ProjectSettings } from '@genie/shared';
import { SiteCrawler } from '@genie/crawler';
import { analyzePage, extractSemanticContent, type SemanticContent } from '@genie/analyzer';
import { generateNextJSProjectFromComponents } from '@genie/generator';
import { createComponentSelectionRequest, selectComponentsWithConfidence } from '@genie/ai-services';

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

/**
 * New component-based pipeline processing
 */
const processPipelineJobComponentBased = async (job: Job<ProjectPipelineJobData>) => {
  const { projectId, sourceUrl, settings } = job.data;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return;
  }

  const startedAt = job.timestamp ?? Date.now();
  const crawler = new SiteCrawler();

  try {
    // Phase 1: Extraction - Crawl and extract content
    console.log(`🔍 Phase 1: Extracting content from ${sourceUrl}`);

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

    const crawlResult = await crawler.crawl({
      projectId,
      startUrl: sourceUrl,
      settings,
      maxConcurrency: 2,
      waitStrategy: 'domcontentloaded',
      onProgress: async (progress: { currentPage: string; pagesDiscovered: number; progress: number }) => {
        if (crawlJob) {
          await prisma.crawlJob.update({
            where: { id: crawlJob.id },
            data: {
              progress: Math.min(progress.progress, 40), // Extraction is 0-40%
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
        data: { progress: 50 }
      });
    }

    // Phase 2: Analysis - Extract semantic content and design tokens
    console.log(`🧠 Phase 2: Analyzing semantic content`);

    // Extract semantic content from pages
    const semanticContents: Record<string, SemanticContent> = {};
    const designTokens: any = {
      colors: new Set<string>(),
      fonts: new Set<string>(),
      spacingScale: new Set<number>(),
      borderRadius: new Set<number>(),
      shadows: new Set<string>(),
      requiredComponents: new Set<string>()
    };

    for (const page of crawlResult.pages) {
      // Extract semantic content
      const semanticContent = extractSemanticContent(page.html);
      semanticContents[page.url] = semanticContent;

      // Extract design tokens
      const analysis = await analyzePage({ html: page.html });
      analysis.designTokens.colors.forEach((c: string) => designTokens.colors.add(c));
      analysis.designTokens.fonts.forEach((f: string) => designTokens.fonts.add(f));
      analysis.designTokens.spacingScale.forEach((s: number) => designTokens.spacingScale.add(s));
      if (analysis.designTokens.borderRadius) {
        analysis.designTokens.borderRadius.forEach((b: number) => designTokens.borderRadius.add(b));
      }
      if (analysis.designTokens.shadows) {
        analysis.designTokens.shadows.forEach((sh: string) => designTokens.shadows.add(sh));
      }
    }

    const combinedTokens = {
      colors: Array.from(designTokens.colors).slice(0, 12),
      fonts: Array.from(designTokens.fonts),
      spacingScale: Array.from(designTokens.spacingScale).sort((a, b) => a - b),
      borderRadius: Array.from(designTokens.borderRadius).sort((a, b) => a - b),
      shadows: Array.from(designTokens.shadows).slice(0, 10),
      requiredComponents: Array.from(designTokens.requiredComponents)
    };

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: { progress: 70 }
      });
    }

    // Phase 3: Selection - Match semantic content to components
    console.log(`🎯 Phase 3: Selecting optimal components`);

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'generating' }
    });

    const pagesWithComponentMatches: Array<{
      url: string;
      title?: string;
      html: string;
      path: string;
      summary?: { url: string; title?: string; metaDescription?: string; mainHeading?: string; contentPreview?: string };
      componentMatches?: import('@genie/ai-services').ComponentMatch[];
    }> = [];

    for (const page of crawlResult.pages) {
      const semanticContent = semanticContents[page.url];
      const urlObj = new URL(page.url);
      const path = urlObj.pathname === '/' ? '/' : urlObj.pathname;

      // Use rule-based component selection
      const componentRegistry = createComponentSelectionRequest(semanticContent).componentRegistry;
      const matches = selectComponentsWithConfidence(semanticContent, componentRegistry);

      pagesWithComponentMatches.push({
        url: page.url,
        title: page.title,
        html: page.html,
        path,
        summary: page.summary,
        componentMatches: matches
      });
    }

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: { progress: 85 }
      });
    }

    // Phase 4: Injection & Assembly - Generate component-based project
    console.log(`🏗️ Phase 4: Generating component-based project`);

    const projectName = new URL(sourceUrl).hostname.replace('www.', '');
    const outputDir = join(tmpdir(), `genie-${projectId}`);

    let generationResult;
    try {
      generationResult = await generateNextJSProjectFromComponents({
        outputDir,
        projectName,
        pages: pagesWithComponentMatches,
        designTokens: combinedTokens,
        colorPalette: undefined, // TODO: extract from semantic analysis
        themeTokens: combinedTokens,
        navigation: crawlResult.navigation
      });
      console.log(`✓ Component-based Next.js project generation completed successfully`);
    } catch (error) {
      console.error(`Failed to generate component-based Next.js project:`, error);
      throw error;
    }

    // Phase 5: Finalization - ZIP and cleanup
    console.log(`📦 Phase 5: Finalizing project`);

    const projectDir = join(outputDir, generationResult.projectDir);
    const zipPath = join(tmpdir(), `genie-${projectId}.zip`);
    await createZipArchive(projectDir, zipPath);

    const { statSync } = await import('node:fs');
    const totalSize = statSync(zipPath).size;

    // Store the ZIP file path (for now we store locally, future: upload to S3)
    // Format: file:///tmp/genie-{projectId}.zip
    const s3ZipPath = `file://${zipPath}`;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    // Create generation record
    await prisma.generation.create({
      data: {
        projectId,
        s3ZipPath,
        fileCount: generationResult.fileCount,
        totalSize
      }
    });

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date()
        }
      });
    }

    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temporary files:', error);
    }

    console.log(`🎉 Component-based pipeline completed successfully for project ${projectId}`);
    console.log(`📊 Generated ${generationResult.fileCount} files, total size: ${totalSize} bytes`);

  } catch (error) {
    console.error(`❌ Component-based pipeline failed for project ${projectId}:`, error);

    // Update project status to failed
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'failed',
        completedAt: new Date()
      }
    }).catch(() => undefined); // Ignore errors in error handler

    // Update crawl job status if exists
    const crawlJob = await prisma.crawlJob.findFirst({
      where: { projectId },
      orderBy: { id: 'desc' }
    });

    if (crawlJob) {
      await prisma.crawlJob.update({
        where: { id: crawlJob.id },
        data: {
          status: 'failed',
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          completedAt: new Date()
        }
      });
    }

    throw error;
  }
};


async function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 6 }, // Keep compression for reasonable size
      store: false
    });

    output.on('close', () => resolve());
    archive.on('error', (err: Error) => reject(err));

    archive.on('warning', (err: Error & { code?: string }) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err.message);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // Exclude node_modules and other large/unnecessary directories
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: [
        'node_modules/**',
        '.next/**',
        '.git/**',
        '*.log',
        '.DS_Store'
      ]
    });

    archive.finalize();
  });
}

function combineColorPalettes(palettes: Array<import('@genie/analyzer').ColorPalette>): import('@genie/analyzer').ColorPalette | undefined {
  if (palettes.length === 0) return undefined;

  // Start with the first palette as base
  const combined: import('@genie/analyzer').ColorPalette = {
    primary: [...palettes[0].primary],
    secondary: [...palettes[0].secondary],
    accent: [...palettes[0].accent],
    neutral: [...palettes[0].neutral],
    semantic: {
      success: [...palettes[0].semantic.success],
      warning: [...palettes[0].semantic.warning],
      error: [...palettes[0].semantic.error],
      info: [...palettes[0].semantic.info]
    },
    background: [...palettes[0].background],
    text: [...palettes[0].text]
  };

  // Merge colors from other palettes, avoiding duplicates
  for (let i = 1; i < palettes.length; i++) {
    const palette = palettes[i];

    // Merge arrays and deduplicate
    combined.primary.push(...palette.primary.filter(c => !combined.primary.includes(c)));
    combined.secondary.push(...palette.secondary.filter(c => !combined.secondary.includes(c)));
    combined.accent.push(...palette.accent.filter(c => !combined.accent.includes(c)));
    combined.neutral.push(...palette.neutral.filter(c => !combined.neutral.includes(c)));
    combined.background.push(...palette.background.filter(c => !combined.background.includes(c)));
    combined.text.push(...palette.text.filter(c => !combined.text.includes(c)));

    // Merge semantic colors
    combined.semantic.success.push(...palette.semantic.success.filter(c => !combined.semantic.success.includes(c)));
    combined.semantic.warning.push(...palette.semantic.warning.filter(c => !combined.semantic.warning.includes(c)));
    combined.semantic.error.push(...palette.semantic.error.filter(c => !combined.semantic.error.includes(c)));
    combined.semantic.info.push(...palette.semantic.info.filter(c => !combined.semantic.info.includes(c)));
  }

  // Limit each category to a reasonable number
  combined.primary = combined.primary.slice(0, 3);
  combined.secondary = combined.secondary.slice(0, 3);
  combined.accent = combined.accent.slice(0, 2);
  combined.neutral = combined.neutral.slice(0, 4);
  combined.background = combined.background.slice(0, 3);
  combined.text = combined.text.slice(0, 3);
  combined.semantic.success = combined.semantic.success.slice(0, 2);
  combined.semantic.warning = combined.semantic.warning.slice(0, 2);
  combined.semantic.error = combined.semantic.error.slice(0, 2);
  combined.semantic.info = combined.semantic.info.slice(0, 2);

  return combined;
}

// Component-based pipeline processor
const pipelineProcessor = processPipelineJobComponentBased;

export const pipelineWorker = new Worker<ProjectPipelineJobData>('project-pipeline', pipelineProcessor, {
  connection: workerRedis
});

pipelineWorker.on('ready', () => {
  if (env.NODE_ENV !== 'test') {
    console.log('Pipeline worker ready and listening for jobs');
  }
});

pipelineWorker.on('active', (job) => {
  if (env.NODE_ENV !== 'test') {
    console.log(`Pipeline job ${job.id} started processing`);
  }
});

pipelineWorker.on('completed', (job) => {
  if (env.NODE_ENV !== 'test') {
    console.log(`Pipeline job ${job.id} completed successfully`);
  }
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
