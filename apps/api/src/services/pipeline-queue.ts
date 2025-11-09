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
import { analyzeDesignTokens, analyzePage, extractContentSlices } from '@genie/analyzer';
import { generateNextJSProject, previewAndRefine } from '@genie/generator';
import { createGeminiClient } from '@genie/ai-services';

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

    // Analyze design tokens and content slices from all pages in parallel
    const allDesignTokens = {
      colors: new Set<string>(),
      fonts: new Set<string>(),
      spacingScale: new Set<number>(),
      borderRadius: new Set<number>(),
      shadows: new Set<string>(),
      requiredComponents: new Set<string>()
    };

    // Also collect color palettes for enhanced theming
    const allColorPalettes: Array<import('@genie/analyzer').ColorPalette> = [];

    // Parallel analysis for faster processing
    const analysisResults = await Promise.all(
      crawlResult.pages.map((page) => analyzePage({ html: page.html }))
    );

    // Combine all tokens and collect content slices
    const pageContentSlices: Array<{ url: string; slices: ReturnType<typeof extractContentSlices> }> = [];

    for (const analysis of analysisResults) {
      const tokens = analysis.designTokens;
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

      // Collect color palettes if available
      if (analysis.colorPalette) {
        allColorPalettes.push(analysis.colorPalette);
      }
    }

    // Collect content slices per page
    for (let i = 0; i < crawlResult.pages.length; i++) {
      const page = crawlResult.pages[i];
      const analysis = analysisResults[i];
      pageContentSlices.push({
        url: page.url,
        slices: analysis.contentSlices
      });
    }

    const combinedTokens = {
      colors: Array.from(allDesignTokens.colors).slice(0, 12),
      fonts: Array.from(allDesignTokens.fonts),
      spacingScale: Array.from(allDesignTokens.spacingScale).sort((a, b) => a - b),
      borderRadius: Array.from(allDesignTokens.borderRadius).sort((a, b) => a - b),
      shadows: Array.from(allDesignTokens.shadows).slice(0, 10),
      requiredComponents: Array.from(allDesignTokens.requiredComponents)
    };

    // Combine color palettes from all pages
    const combinedColorPalette = combineColorPalettes(allColorPalettes);

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

    // Generate content using Gemini if API key is available
    const geminiClient = env.GEMINI_API_KEY ? createGeminiClient({ apiKey: env.GEMINI_API_KEY }) : null;
    const pagesWithGeneratedContent: Array<{
      url: string;
      title?: string;
      html: string;
      path: string;
      summary?: { url: string; title?: string; metaDescription?: string; mainHeading?: string; contentPreview?: string };
      contentSlices?: Array<{ type: string; content: string; metadata?: Record<string, unknown> }>;
      generatedContent?: string;
    }> = [];

    if (geminiClient) {
      // Generate content for each page using Gemini
      for (let i = 0; i < crawlResult.pages.length; i++) {
        const page = crawlResult.pages[i];
        const urlObj = new URL(page.url);
        const path = urlObj.pathname === '/' ? '/' : urlObj.pathname;
        const contentSliceData = pageContentSlices.find(p => p.url === page.url);
        
        try {
          // Create a template structure hint based on detected components
          const templateStructure = `Use shadcn/ui components: ${combinedTokens.requiredComponents?.slice(0, 5).join(', ') || 'button, card'}`;
          
          const generated = await geminiClient.generateContent({
            pageSummary: page.summary || {
              url: page.url,
              title: page.title,
              metaDescription: page.metaDescription,
              mainHeading: undefined,
              contentPreview: undefined
            },
            contentSlices: contentSliceData?.slices || [],
            themeTokens: {
              colors: combinedTokens.colors,
              fonts: combinedTokens.fonts,
              spacingScale: combinedTokens.spacingScale,
              borderRadius: combinedTokens.borderRadius,
              shadows: combinedTokens.shadows,
              requiredComponents: combinedTokens.requiredComponents
            },
            templateStructure,
            navigation: crawlResult.navigation
          });

          pagesWithGeneratedContent.push({
            url: page.url,
            title: page.title,
            html: page.html,
            path,
            summary: page.summary,
            contentSlices: contentSliceData?.slices,
            generatedContent: generated.generatedContent
          });
        } catch (error) {
          console.warn(`Failed to generate content for ${page.url}:`, error);
          // Fallback to page without AI-generated content
          pagesWithGeneratedContent.push({
            url: page.url,
            title: page.title,
            html: page.html,
            path,
            summary: page.summary,
            contentSlices: contentSliceData?.slices
          });
        }
      }
    } else {
      // No Gemini API key, use pages without generated content
      pagesWithGeneratedContent.push(...crawlResult.pages.map((page: { url: string; title?: string; html: string; summary?: { url: string; title?: string; metaDescription?: string; mainHeading?: string; contentPreview?: string } }) => {
        const urlObj = new URL(page.url);
        const path = urlObj.pathname === '/' ? '/' : urlObj.pathname;
        const contentSliceData = pageContentSlices.find(p => p.url === page.url);
        return {
          url: page.url,
          title: page.title,
          html: page.html,
          path,
          summary: page.summary,
          contentSlices: contentSliceData?.slices
        };
      }));
    }

    // Generate Next.js project
    const projectName = new URL(sourceUrl).hostname.replace('www.', '');
    const outputDir = join(tmpdir(), `genie-${projectId}`);

    console.log(`Starting Next.js project generation for ${projectName}...`);

    let generationResult;
    try {
      generationResult = await generateNextJSProject({
        outputDir,
        projectName,
        pages: pagesWithGeneratedContent,
        designTokens: combinedTokens,
        colorPalette: combinedColorPalette,
        themeTokens: {
          colors: combinedTokens.colors,
          fonts: combinedTokens.fonts,
          spacingScale: combinedTokens.spacingScale,
          borderRadius: combinedTokens.borderRadius,
          shadows: combinedTokens.shadows,
          requiredComponents: combinedTokens.requiredComponents
        },
        navigation: crawlResult.navigation
      });
      console.log(`✓ Next.js project generation completed successfully`);
    } catch (error) {
      console.error(`Failed to generate Next.js project:`, error);
      throw error;
    }

    // Use the actual project directory created by pnpm create next-app
    const projectDir = join(outputDir, generationResult.projectDir);
    console.log(`Project directory: ${projectDir}`);

    // Preview and refine with Gemini if available
    if (geminiClient) {
      try {
        const refinedPages = await previewAndRefine({
          projectDir,
          projectId,
          pages: pagesWithGeneratedContent.map(p => ({
            url: p.url,
            path: p.path,
            generatedContent: p.generatedContent
          })),
          designTokens: combinedTokens,
          geminiClient
        });

        // Update refined pages in the project
        if (refinedPages.length > 0) {
          const { writeFile } = await import('node:fs/promises');
          for (const refined of refinedPages) {
            const pagePath = refined.path === '/' ? 'app/page.tsx' : `app${refined.path}/page.tsx`;
            const fullPath = join(outputDir, pagePath);
            try {
              await writeFile(fullPath, refined.refinedContent, 'utf8');
            } catch (error) {
              console.warn(`Failed to write refined content to ${pagePath}:`, error);
            }
          }
        }
      } catch (error) {
        console.warn(`Preview and refine failed, continuing with original content:`, error);
        // Continue with original content if refinement fails
      }
    }

    // Create ZIP file (optimized streaming)
    const zipPath = join(tmpdir(), `genie-${projectId}.zip`);
    await createZipArchive(projectDir, zipPath);

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
    // Include all files except node_modules
    // archiver.directory will include everything, we'll filter via glob pattern
    archive.directory(sourceDir, false);
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

export const pipelineWorker = new Worker<ProjectPipelineJobData>('project-pipeline', processPipelineJob, {
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
