import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { processPipelineJobComponentBased } from '../pipeline-queue.js';

// Mock all dependencies
vi.mock('@genie/crawler');
vi.mock('@genie/analyzer');
vi.mock('@genie/ai-services');
vi.mock('@genie/generator');
vi.mock('fs');
vi.mock('archiver');
vi.mock('fs/promises');
vi.mock('../../db/prisma.js', () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
      update: vi.fn()
    },
    crawlJob: {
      findFirst: vi.fn(),
      update: vi.fn()
    },
    page: {
      createMany: vi.fn()
    }
  }
}));

import { prisma } from '../../db/prisma.js';

describe('Component-Based Pipeline', () => {
  let mockJob: any;

  beforeEach(() => {
    mockJob = {
      data: {
        projectId: 'test-project-id',
        userId: 'test-user-id',
        sourceUrl: 'https://example.com',
        settings: {}
      },
      timestamp: Date.now()
    };

    // Mock Prisma
    prisma.project.findUnique.mockResolvedValue({
      id: 'test-project-id',
      status: 'queued',
      userId: 'test-user-id',
      sourceUrl: 'https://example.com',
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    prisma.crawlJob.findFirst.mockResolvedValue({
      id: 'test-crawl-job-id',
      projectId: 'test-project-id',
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    prisma.project.update.mockResolvedValue({} as any);
    prisma.crawlJob.update.mockResolvedValue({} as any);
    prisma.page.createMany.mockResolvedValue({} as any);

    // Mock crawler
    const { SiteCrawler } = require('@genie/crawler');
    SiteCrawler.mockImplementation(() => ({
      crawl: vi.fn().mockResolvedValue({
        pages: [
          {
            url: 'https://example.com',
            html: '<html><body><h1>Welcome</h1><p>Description</p></body></html>',
            title: 'Test Page',
            metaDescription: 'Test description'
          }
        ],
        navigation: [
          { url: '/', text: 'Home' },
          { url: '/about', text: 'About' }
        ]
      })
    }));

    // Mock analyzer
    const { extractSemanticContent, analyzePage } = require('@genie/analyzer');
    extractSemanticContent.mockReturnValue({
      hero: {
        title: 'Welcome',
        description: 'Welcome message',
        primaryButton: { text: 'Get Started', url: '/start' }
      }
    });

    analyzePage.mockResolvedValue({
      designTokens: {
        colors: ['#000', '#fff'],
        fonts: ['Arial'],
        spacingScale: [4, 8, 16],
        borderRadius: [4, 8],
        shadows: [],
        requiredComponents: ['button']
      },
      contentSlices: [],
      semanticContent: {}
    });

    // Mock AI services
    const { createComponentSelectionRequest, selectComponentsWithConfidence } = require('@genie/ai-services');
    createComponentSelectionRequest.mockReturnValue({
      semanticContent: { hero: {} },
      componentRegistry: { availableComponents: [] }
    });

    selectComponentsWithConfidence.mockReturnValue([
      {
        componentId: 'hero-default',
        componentType: 'hero',
        confidence: 0.9,
        reasoning: 'Direct match',
        contentMapping: { title: 'Welcome' }
      }
    ]);

    // Mock generator
    const { generateNextJSProjectFromComponents } = require('@genie/generator');
    generateNextJSProjectFromComponents.mockResolvedValue({
      fileCount: 5,
      totalSize: 1000,
      projectDir: 'test-project'
    });

    // Mock fs
    const fs = require('fs');
    fs.createWriteStream.mockReturnValue({} as any);
    fs.statSync.mockReturnValue({ size: 1000 });

    // Mock archiver
    const archiver = require('archiver');
    archiver.default.mockReturnValue({
      pipe: vi.fn(),
      directory: vi.fn(),
      finalize: vi.fn()
    });

    // Mock fs/promises
    const fsPromises = require('fs/promises');
    fsPromises.rm.mockResolvedValue(undefined);
    fsPromises.readFileSync.mockReturnValue(Buffer.from('zip data'));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should process a component-based pipeline successfully', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    // Verify pipeline phases were called
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-project-id' },
        data: { status: 'crawling' }
      })
    );

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-project-id' },
        data: { status: 'analyzing' }
      })
    );

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-project-id' },
        data: { status: 'generating' }
      })
    );

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'test-project-id' },
        data: { status: 'completed' }
      })
    );
  });

  it('should handle semantic content extraction', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    // Verify semantic content extraction was called
    const { extractSemanticContent } = await import('@genie/analyzer');
    expect(extractSemanticContent).toHaveBeenCalledWith(
      '<html><body><h1>Welcome</h1><p>Description</p></body></html>'
    );
  });

  it('should perform component selection', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    // Verify component selection was called
    const { selectComponentsWithConfidence } = await import('@genie/ai-services');
    expect(selectComponentsWithConfidence).toHaveBeenCalled();
  });

  it('should generate component-based project', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    // Verify component-based generation was called
    const { generateNextJSProjectFromComponents } = await import('@genie/generator');
    expect(generateNextJSProjectFromComponents).toHaveBeenCalledWith(
      expect.objectContaining({
        outputDir: expect.stringContaining('genie-test-project-id'),
        projectName: 'example.com',
        pages: expect.arrayContaining([
          expect.objectContaining({
            componentMatches: expect.any(Array)
          })
        ])
      })
    );
  });

  it('should update progress through pipeline phases', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    // Verify progress updates
    expect(prisma.crawlJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { progress: 40 } // Extraction phase
      })
    );

    expect(prisma.crawlJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { progress: 50 } // Analysis phase
      })
    );

    expect(prisma.crawlJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { progress: 70 } // More analysis
      })
    );

    expect(prisma.crawlJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { progress: 85 } // Selection phase
      })
    );

    expect(prisma.crawlJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { progress: 100 } // Completion
      })
    );
  });

  it('should handle pipeline failures gracefully', async () => {
    // Mock a failure in the crawler
    const { SiteCrawler } = await import('@genie/crawler');
    vi.mocked(SiteCrawler).mockImplementation(() => ({
      crawl: vi.fn().mockRejectedValue(new Error('Crawling failed'))
    }));

    await expect(processPipelineJobComponentBased(mockJob as any)).rejects.toThrow('Crawling failed');

    // Verify error handling
    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'failed' }
      })
    );

    expect(prisma.crawlJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: 'failed',
          errors: ['Crawling failed']
        }
      })
    );
  });

  it('should store crawled pages in database', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    expect(prisma.page.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          projectId: 'test-project-id',
          url: 'https://example.com',
          title: 'Test Page',
          metaDescription: 'Test description'
        })
      ]),
      skipDuplicates: true
    });
  });

  it('should create and store ZIP file', async () => {
    await processPipelineJobComponentBased(mockJob as any);

    expect(prisma.project.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'completed',
          zipFile: expect.any(Buffer),
          zipFileSize: 1000,
          completedAt: expect.any(Date)
        })
      })
    );
  });
});
