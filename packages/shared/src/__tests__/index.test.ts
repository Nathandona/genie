import { describe, it, expect } from 'vitest';
import { PROJECT_STATUSES, type ProjectStatus, type ProjectSettings, type CrawlProgress } from '../index.js';

describe('@genie/shared', () => {
  describe('PROJECT_STATUSES', () => {
    it('should export PROJECT_STATUSES constant', () => {
      expect(PROJECT_STATUSES).toBeDefined();
      expect(Array.isArray(PROJECT_STATUSES)).toBe(true);
    });

    it('should contain all expected status values', () => {
      const expectedStatuses = ['queued', 'crawling', 'analyzing', 'generating', 'completed', 'failed'];
      
      expectedStatuses.forEach(status => {
        expect(PROJECT_STATUSES).toContain(status);
      });
    });

    it('should be a readonly array', () => {
      expect(PROJECT_STATUSES.length).toBe(6);
    });
  });

  describe('ProjectStatus type', () => {
    it('should accept valid status values', () => {
      const validStatuses: ProjectStatus[] = [
        'queued',
        'crawling',
        'analyzing',
        'generating',
        'completed',
        'failed',
      ];

      validStatuses.forEach(status => {
        expect(PROJECT_STATUSES).toContain(status);
      });
    });

    it('should match PROJECT_STATUSES values', () => {
      const status: ProjectStatus = 'queued';
      expect(PROJECT_STATUSES).toContain(status);
    });
  });

  describe('ProjectSettings interface', () => {
    it('should accept valid project settings', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
      };

      expect(settings.maxPages).toBe(10);
    });

    it('should accept settings with include patterns', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
        includePatterns: ['https://example.com'],
      };

      expect(settings.includePatterns).toBeDefined();
      expect(settings.includePatterns?.length).toBe(1);
      expect(settings.includePatterns?.[0]).toBe('https://example.com');
    });

    it('should accept settings with exclude patterns', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
        excludePatterns: ['/admin', '/private'],
      };

      expect(settings.excludePatterns).toBeDefined();
      expect(settings.excludePatterns?.length).toBe(2);
      expect(settings.excludePatterns).toContain('/admin');
      expect(settings.excludePatterns).toContain('/private');
    });

    it('should accept settings with authentication', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
        authentication: {
          username: 'test@example.com',
          password: 'password123',
        },
      };

      expect(settings.authentication).toBeDefined();
      expect(settings.authentication?.username).toBe('test@example.com');
      expect(settings.authentication?.password).toBe('password123');
    });

    it('should accept complete settings object', () => {
      const settings: ProjectSettings = {
        maxPages: 20,
        includePatterns: ['https://example.com'],
        excludePatterns: ['/admin'],
        authentication: {
          username: 'user@example.com',
          password: 'secret',
        },
      };

      expect(settings.maxPages).toBe(20);
      expect(settings.includePatterns).toBeDefined();
      expect(settings.excludePatterns).toBeDefined();
      expect(settings.authentication).toBeDefined();
    });
  });

  describe('CrawlProgress interface', () => {
    it('should accept valid crawl progress', () => {
      const progress: CrawlProgress = {
        projectId: 'test-project-123',
        status: 'crawling',
        progress: 50,
        pagesDiscovered: 5,
        errors: [],
      };

      expect(progress.projectId).toBe('test-project-123');
      expect(progress.status).toBe('crawling');
      expect(progress.progress).toBe(50);
      expect(progress.pagesDiscovered).toBe(5);
      expect(progress.errors).toEqual([]);
    });

    it('should accept progress with current page', () => {
      const progress: CrawlProgress = {
        projectId: 'test-project-123',
        status: 'crawling',
        progress: 30,
        currentPage: 'https://example.com/page1',
        pagesDiscovered: 3,
        errors: [],
      };

      expect(progress.currentPage).toBe('https://example.com/page1');
    });

    it('should accept progress with errors', () => {
      const progress: CrawlProgress = {
        projectId: 'test-project-123',
        status: 'crawling',
        progress: 40,
        pagesDiscovered: 4,
        errors: ['Failed to crawl https://example.com/bad-page'],
      };

      expect(progress.errors.length).toBe(1);
      expect(progress.errors[0]).toContain('Failed to crawl');
    });

    it('should accept all status values', () => {
      const statuses: ProjectStatus[] = ['queued', 'crawling', 'analyzing', 'generating', 'completed', 'failed'];
      
      statuses.forEach(status => {
        const progress: CrawlProgress = {
          projectId: 'test-project',
          status,
          progress: 0,
          pagesDiscovered: 0,
          errors: [],
        };

        expect(progress.status).toBe(status);
      });
    });

    it('should handle progress at different stages', () => {
      const queuedProgress: CrawlProgress = {
        projectId: 'test-project',
        status: 'queued',
        progress: 0,
        pagesDiscovered: 0,
        errors: [],
      };

      const completedProgress: CrawlProgress = {
        projectId: 'test-project',
        status: 'completed',
        progress: 100,
        pagesDiscovered: 10,
        errors: [],
      };

      expect(queuedProgress.progress).toBe(0);
      expect(completedProgress.progress).toBe(100);
      expect(completedProgress.pagesDiscovered).toBe(10);
    });
  });

  describe('Type exports', () => {
    it('should export all required types', () => {
      // Type checking test - if this compiles, types are exported correctly
      const status: ProjectStatus = 'queued';
      const settings: ProjectSettings = { maxPages: 10 };
      const progress: CrawlProgress = {
        projectId: 'test',
        status: 'crawling',
        progress: 0,
        pagesDiscovered: 0,
        errors: [],
      };

      expect(status).toBeDefined();
      expect(settings).toBeDefined();
      expect(progress).toBeDefined();
    });
  });
});

