import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import projectRoutes from '../projects.js';
import { createTestApp, createAuthHeaders, createMockPrisma } from './test-helper.js';
import { enqueueProjectPipeline } from '../../services/pipeline-queue.js';

// Mock pipeline queue
vi.mock('../../services/pipeline-queue.js', () => ({
  enqueueProjectPipeline: vi.fn().mockResolvedValue(undefined),
}));

describe('Projects API Routes', () => {
  let app: FastifyInstance;
  const mockUserId = 'user-123';
  const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
  const mockDb = createMockPrisma();

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createTestApp(projectRoutes, { mockDb });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /projects', () => {
    it('should create a project with valid data', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'queued' as const,
        pageCount: 0,
        generationTime: null,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      mockDb.project.create.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.create.mockResolvedValue({ id: 'job-123' } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
        payload: {
          sourceUrl: 'https://example.com',
          settings: { maxPages: 10 },
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(mockProjectId);
      expect(body.sourceUrl).toBe('https://example.com');
      expect(mockDb.project.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          sourceUrl: 'https://example.com',
          settings: { maxPages: 10 },
        },
      });
      expect(enqueueProjectPipeline).toHaveBeenCalled();
    });

    it('should use default settings when not provided', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'queued' as const,
        pageCount: 0,
        generationTime: null,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      mockDb.project.create.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.create.mockResolvedValue({ id: 'job-123' } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
        payload: {
          sourceUrl: 'https://example.com',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockDb.project.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          sourceUrl: 'https://example.com',
          settings: { maxPages: 10 },
        },
      });
    });

    it('should validate URL format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
        payload: {
          sourceUrl: 'not-a-url',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should validate maxPages range', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
        payload: {
          sourceUrl: 'https://example.com',
          settings: { maxPages: 1000 },
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        payload: {
          sourceUrl: 'https://example.com',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should accept includePatterns and excludePatterns', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'queued' as const,
        pageCount: 0,
        generationTime: null,
        settings: {
          maxPages: 20,
          includePatterns: ['/blog/**', '/docs/**'],
          excludePatterns: ['/admin/**'],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      mockDb.project.create.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.create.mockResolvedValue({ id: 'job-123' } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
        payload: {
          sourceUrl: 'https://example.com',
          settings: {
            maxPages: 20,
            includePatterns: ['/blog/**', '/docs/**'],
            excludePatterns: ['/admin/**'],
          },
        },
      });

      expect(response.statusCode).toBe(201);
      expect(mockDb.project.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          sourceUrl: 'https://example.com',
          settings: {
            maxPages: 20,
            includePatterns: ['/blog/**', '/docs/**'],
            excludePatterns: ['/admin/**'],
          },
        },
      });
    });

    it('should validate maxPages minimum value', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
        payload: {
          sourceUrl: 'https://example.com',
          settings: { maxPages: 0 },
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /projects', () => {
    it('should return user projects', async () => {
      const mockProjects = [
        {
          id: mockProjectId,
          userId: mockUserId,
          sourceUrl: 'https://example.com',
          status: 'completed' as const,
          pageCount: 5,
          generationTime: 120,
          settings: { maxPages: 10 },
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      mockDb.project.findMany.mockResolvedValue(mockProjects as any);

      const response = await app.inject({
        method: 'GET',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].id).toBe(mockProjectId);
      expect(mockDb.project.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no projects', async () => {
      mockDb.project.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/projects',
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project if user owns it', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(mockProjectId);
      expect(body.userId).toBe(mockUserId);
    });

    it('should return 404 if project not found', async () => {
      mockDb.project.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Project not found');
    });

    it('should return 404 if user does not own project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: 'other-user',
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Project not found');
    });

    it('should validate UUID format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/projects/invalid-id',
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /projects/:id/pages', () => {
    it('should return pages for a project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 2,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const mockPages = [
        {
          id: 'page-1',
          projectId: mockProjectId,
          url: 'https://example.com/page1',
          title: 'Page 1',
          metaDescription: 'Description 1',
          htmlSnapshot: '<html>...</html>',
          createdAt: new Date(),
        },
        {
          id: 'page-2',
          projectId: mockProjectId,
          url: 'https://example.com/page2',
          title: 'Page 2',
          metaDescription: 'Description 2',
          htmlSnapshot: '<html>...</html>',
          createdAt: new Date(),
        },
      ];

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.page.findMany.mockResolvedValue(mockPages as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/pages`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body[0].id).toBe('page-1');
      expect(body[0].url).toBe('https://example.com/page1');
      expect(mockDb.page.findMany).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return 404 if project not found', async () => {
      mockDb.project.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/pages`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 if user does not own project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: 'other-user',
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 2,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/pages`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Project not found');
    });

    it('should return empty array when no pages exist', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 0,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.page.findMany.mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/pages`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([]);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/pages`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /projects/:id/progress', () => {
    it('should return progress data for a project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'crawling' as const,
        pageCount: 5,
        generationTime: null,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      const mockCrawlJob = {
        id: 'job-123',
        projectId: mockProjectId,
        status: 'in_progress' as const,
        progress: 50,
        currentPage: 'https://example.com/page3',
        pagesDiscovered: 5,
        startedAt: new Date(),
        completedAt: null,
        errors: [],
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.findFirst.mockResolvedValue(mockCrawlJob as any);
      mockDb.page.count.mockResolvedValue(5);
      mockDb.asset.count.mockResolvedValue(10);
      mockDb.generation.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.project.id).toBe(mockProjectId);
      expect(body.crawlJob).toBeDefined();
      expect(body.crawlJob.progress).toBe(50);
      expect(body.stats.pagesDiscovered).toBe(5);
      expect(body.stats.assetsOptimized).toBe(10);
    });

    it('should handle missing crawl job', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'queued' as const,
        pageCount: 0,
        generationTime: null,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.findFirst.mockResolvedValue(null);
      mockDb.page.count.mockResolvedValue(0);
      mockDb.asset.count.mockResolvedValue(0);
      mockDb.generation.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.crawlJob).toBeNull();
    });

    it('should calculate componentsCreated from generation fileCount', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const mockCrawlJob = {
        id: 'job-123',
        projectId: mockProjectId,
        status: 'completed' as const,
        progress: 100,
        currentPage: null,
        pagesDiscovered: 5,
        startedAt: new Date(),
        completedAt: new Date(),
        errors: [],
      };

      const mockGeneration = {
        id: 'gen-123',
        projectId: mockProjectId,
        version: 1,
        s3ZipPath: 's3://bucket/project-123.zip',
        fileCount: 75,
        totalSize: 1024000,
        downloadCount: 0,
        createdAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.findFirst.mockResolvedValue(mockCrawlJob as any);
      mockDb.page.count.mockResolvedValue(5);
      mockDb.asset.count.mockResolvedValue(10);
      mockDb.generation.findFirst.mockResolvedValue(mockGeneration as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.stats.componentsMatched).toBe(15); // Math.floor(75 / 5) = 15
    });

    it('should return 0 componentsMatched when no generation', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'crawling' as const,
        pageCount: 5,
        generationTime: null,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.findFirst.mockResolvedValue(null);
      mockDb.page.count.mockResolvedValue(5);
      mockDb.asset.count.mockResolvedValue(10);
      mockDb.generation.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.stats.componentsMatched).toBe(0);
    });

    it('should return pipeline information for different project statuses', async () => {
      const testCases = [
        {
          status: 'queued' as const,
          expectedPhase: 'queued',
          expectedProgress: 0,
          expectedDescription: 'Project is queued for processing'
        },
        {
          status: 'crawling' as const,
          expectedPhase: 'extraction',
          expectedProgress: 25,
          expectedDescription: 'Crawling website and extracting content',
          crawlJobProgress: 25
        },
        {
          status: 'analyzing' as const,
          expectedPhase: 'analysis',
          expectedProgress: 50,
          expectedDescription: 'Analyzing semantic content and design tokens',
          crawlJobProgress: 50
        },
        {
          status: 'generating' as const,
          expectedPhase: 'selection',
          expectedProgress: 80,
          expectedDescription: 'AI matching content to optimal UI components',
          crawlJobProgress: 80
        },
        {
          status: 'completed' as const,
          expectedPhase: 'finalization',
          expectedProgress: 100,
          expectedDescription: 'Finalizing and packaging project'
        }
      ];

      for (const testCase of testCases) {
        const mockProject = {
          id: mockProjectId,
          userId: mockUserId,
          sourceUrl: 'https://example.com',
          status: testCase.status,
          pageCount: 5,
          generationTime: null,
          settings: { maxPages: 10 },
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: testCase.status === 'completed' ? new Date() : null,
        };

        const mockCrawlJob = testCase.crawlJobProgress ? {
          id: 'job-123',
          projectId: mockProjectId,
          status: 'running' as const,
          progress: testCase.crawlJobProgress,
          currentPage: 'https://example.com/page',
          pagesDiscovered: 5,
          startedAt: new Date(),
          completedAt: null,
          errors: [],
        } : null;

        mockDb.project.findUnique.mockResolvedValue(mockProject as any);
        mockDb.crawlJob.findFirst.mockResolvedValue(mockCrawlJob as any);
        mockDb.page.count.mockResolvedValue(5);
        mockDb.asset.count.mockResolvedValue(10);
        mockDb.generation.findFirst.mockResolvedValue(null);

        const response = await app.inject({
          method: 'GET',
          url: `/projects/${mockProjectId}/progress`,
          headers: createAuthHeaders(mockUserId),
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.pipeline.currentPhase).toBe(testCase.expectedPhase);
        expect(body.pipeline.phaseProgress).toBe(testCase.expectedProgress);
        expect(body.pipeline.overallProgress).toBe(testCase.expectedProgress);
        expect(body.pipeline.phaseDescription).toBe(testCase.expectedDescription);
      }
    });

    it('should calculate componentsMatched from generation fileCount', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const mockGeneration = {
        id: 'gen-123',
        projectId: mockProjectId,
        version: 1,
        s3ZipPath: 'file:///tmp/genie-project.zip',
        fileCount: 25,
        totalSize: 1024000,
        downloadCount: 0,
        createdAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.crawlJob.findFirst.mockResolvedValue(null);
      mockDb.page.count.mockResolvedValue(5);
      mockDb.asset.count.mockResolvedValue(10);
      mockDb.generation.findFirst.mockResolvedValue(mockGeneration as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.stats.componentsMatched).toBe(5); // Math.floor(25 / 5) = 5
    });

    it('should return 404 if user does not own project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: 'other-user',
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Project not found');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/progress`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /projects/:id/download', () => {
    it('should return download link for latest generation', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      const mockGeneration = {
        id: 'gen-123',
        projectId: mockProjectId,
        version: 1,
        s3ZipPath: 's3://bucket/project-123.zip',
        fileCount: 50,
        totalSize: 1024000,
        downloadCount: 0,
        createdAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.generation.findFirst.mockResolvedValue(mockGeneration as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/download`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.download).toBe('s3://bucket/project-123.zip');
      expect(body.fileCount).toBe(50);
      expect(body.totalSize).toBe(1024000);
    });

    it('should return 404 if no generation available', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.generation.findFirst.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/download`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('No generation available');
    });

    it('should return 404 if user does not own project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: 'other-user',
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/download`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Project not found');
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/projects/${mockProjectId}/download`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project and related records', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: mockUserId,
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);
      mockDb.generation.deleteMany.mockResolvedValue({ count: 1 });
      mockDb.page.deleteMany.mockResolvedValue({ count: 5 });
      mockDb.crawlJob.deleteMany.mockResolvedValue({ count: 1 });
      mockDb.project.delete.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${mockProjectId}`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(204);
      expect(mockDb.generation.deleteMany).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
      });
      expect(mockDb.page.deleteMany).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
      });
      expect(mockDb.crawlJob.deleteMany).toHaveBeenCalledWith({
        where: { projectId: mockProjectId },
      });
      expect(mockDb.project.delete).toHaveBeenCalledWith({
        where: { id: mockProjectId },
      });
    });

    it('should return 404 if project not found', async () => {
      mockDb.project.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${mockProjectId}`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 if user does not own project', async () => {
      const mockProject = {
        id: mockProjectId,
        userId: 'other-user',
        sourceUrl: 'https://example.com',
        status: 'completed' as const,
        pageCount: 5,
        generationTime: 120,
        settings: { maxPages: 10 },
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: new Date(),
      };

      mockDb.project.findUnique.mockResolvedValue(mockProject as any);

      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${mockProjectId}`,
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/projects/${mockProjectId}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should validate UUID format', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/projects/invalid-id',
        headers: createAuthHeaders(mockUserId),
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
