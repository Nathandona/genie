import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiClient, type Project, type Page, type CrawlJob, type DownloadInfo } from '../api-client';

// Mock dev-utils
vi.mock('../dev-utils', () => ({
  DEV_UTILS: {
    logApiCall: vi.fn(),
  },
}));

describe('ApiClient', () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = mockFetch;
    // Set up a mock token getter for tests
    apiClient.setTokenGetter(async () => 'test-token');
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('getProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          sourceUrl: 'https://example.com',
          status: 'completed',
          pageCount: 5,
          generationTime: 1000,
          settings: { maxPages: 10 },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-01T01:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProjects,
      });

      const result = await apiClient.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockProjects);
    });

    it('should handle errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(apiClient.getProjects()).rejects.toThrow('Server error');
    });
  });

  describe('getProject', () => {
    it('should fetch a single project', async () => {
      const mockProject: Project = {
        id: '1',
        sourceUrl: 'https://example.com',
        status: 'completed',
        pageCount: 5,
        generationTime: 1000,
        settings: { maxPages: 10 },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        completedAt: '2024-01-01T01:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await apiClient.getProject('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      const mockProject: Project = {
        id: '1',
        sourceUrl: 'https://example.com',
        status: 'queued',
        pageCount: 0,
        generationTime: null,
        settings: { maxPages: 10 },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        completedAt: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
      });

      const result = await apiClient.createProject({
        sourceUrl: 'https://example.com',
        settings: { maxPages: 10 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            sourceUrl: 'https://example.com',
            settings: { maxPages: 10 },
          }),
        })
      );
      expect(result).toEqual(mockProject);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await apiClient.deleteProject('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('getProjectPages', () => {
    it('should fetch project pages', async () => {
      const mockPages: Page[] = [
        {
          id: '1',
          url: 'https://example.com/page1',
          title: 'Page 1',
          metaDescription: 'Description',
          htmlSnapshot: '<html>...</html>',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPages,
      });

      const result = await apiClient.getProjectPages('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1/pages'),
        expect.any(Object)
      );
      expect(result).toEqual(mockPages);
    });
  });

  describe('getDownloadInfo', () => {
    it('should fetch download info', async () => {
      const mockInfo: DownloadInfo = {
        download: 'https://example.com/download.zip',
        fileCount: 10,
        totalSize: 1024000,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfo,
      });

      const result = await apiClient.getDownloadInfo('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1/download'),
        expect.any(Object)
      );
      expect(result).toEqual(mockInfo);
    });
  });

  describe('downloadProject', () => {
    it('should download project as blob', async () => {
      const mockBlob = new Blob(['zip content'], { type: 'application/zip' });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await apiClient.downloadProject('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1/download'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
          }),
        })
      );
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle download errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(apiClient.downloadProject('1')).rejects.toThrow('Download failed');
    });
  });

  describe('getProjectStatus', () => {
    it('should fetch project status with crawl job', async () => {
      const mockStatus = {
        project: {
          id: '1',
          sourceUrl: 'https://example.com',
          status: 'crawling' as const,
          pageCount: 5,
          generationTime: null,
          settings: { maxPages: 10 },
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          completedAt: null,
        },
        crawlJob: {
          id: 'job-1',
          projectId: '1',
          status: 'running' as const,
          progress: 50,
          currentPage: 'https://example.com/page1',
          pagesDiscovered: 5,
          errors: [],
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: null,
        },
        stats: {
          pagesDiscovered: 5,
          componentsCreated: 10,
          assetsOptimized: 3,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await apiClient.getProjectStatus('1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/1/progress'),
        expect.any(Object)
      );
      expect(result).toEqual(mockStatus);
    });
  });

  // Note: login/register methods removed - authentication now handled by NextAuth
  // These tests are kept for reference but the methods no longer exist in apiClient

  describe('Polar.sh methods', () => {
    it('should get Polar products', async () => {
      const mockProducts = [{ id: '1', name: 'Pro Plan' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ products: mockProducts }),
      });

      const result = await apiClient.getPolarProducts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/polar/products'),
        expect.any(Object)
      );
      expect(result).toEqual(mockProducts);
    });

    it('should create Polar checkout', async () => {
      const mockCheckout = {
        checkoutUrl: 'https://polar.sh/checkout/123',
        checkoutId: '123',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCheckout,
      });

      const result = await apiClient.createPolarCheckout('price-123', 'https://example.com/success');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/polar/checkout'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            priceId: 'price-123',
            successUrl: 'https://example.com/success',
          }),
        })
      );
      expect(result).toEqual(mockCheckout);
    });

    it('should get Polar subscriptions', async () => {
      const mockSubscriptions = [{ id: '1', status: 'active' }];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subscriptions: mockSubscriptions }),
      });

      const result = await apiClient.getPolarSubscriptions();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/polar/subscriptions'),
        expect.any(Object)
      );
      expect(result).toEqual(mockSubscriptions);
    });

    it('should cancel Polar subscription', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await apiClient.cancelPolarSubscription('sub-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/polar/subscriptions/sub-123/cancel'),
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(result).toBe(true);
    });

    it('should get Polar portal URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://polar.sh/portal' }),
      });

      const result = await apiClient.getPolarPortalUrl();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/polar/portal'),
        expect.any(Object)
      );
      expect(result).toBe('https://polar.sh/portal');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.getProjects()).rejects.toThrow('Network error');
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient.getProjects()).rejects.toThrow('Request failed');
    });

    it('should handle requests without auth token', async () => {
      // Set token getter to return null
      apiClient.setTokenGetter(async () => null);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await apiClient.getProjects();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });
});

