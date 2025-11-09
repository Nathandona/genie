import { describe, it, expect } from 'vitest';
import { getDomainName, getUrlEmoji, convertProject, type Project } from '../project-utils';
import { type Project as ApiProject } from '../api-client';

describe('project-utils', () => {
  describe('getDomainName', () => {
    it('should extract domain name from valid URL', () => {
      expect(getDomainName('https://example.com')).toBe('example');
      expect(getDomainName('https://www.example.com')).toBe('example');
      expect(getDomainName('http://subdomain.example.com')).toBe('subdomain');
    });

    it('should handle URLs without protocol', () => {
      // When URL doesn't have protocol, new URL() will throw, so it returns the original string
      expect(getDomainName('example.com')).toBe('example.com');
      expect(getDomainName('www.example.com')).toBe('www.example.com');
    });

    it('should return original string for invalid URL', () => {
      expect(getDomainName('not-a-url')).toBe('not-a-url');
      expect(getDomainName('')).toBe('');
    });

    it('should handle complex domains', () => {
      expect(getDomainName('https://my-awesome-site.com')).toBe('my-awesome-site');
      expect(getDomainName('https://test.co.uk')).toBe('test');
    });
  });

  describe('convertProject', () => {
    const createApiProject = (overrides: Partial<ApiProject> = {}): ApiProject => ({
      id: 'test-id',
      sourceUrl: 'https://example.com',
      status: 'completed',
      pageCount: 5,
      generationTime: 1000,
      settings: {
        maxPages: 10,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      completedAt: '2024-01-01T01:00:00Z',
      ...overrides,
    });

    it('should convert completed project correctly', () => {
      const apiProject = createApiProject({ status: 'completed' });
      const result = convertProject(apiProject);

      expect(result.id).toBe('test-id');
      expect(result.url).toBe('https://example.com');
      expect(result.status).toBe('completed');
      expect(result.pagesCount).toBe(5);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.name).toBe('Example');
      expect(result.thumbnail).toBe('🌐');
    });

    it('should convert crawling project to processing status', () => {
      const apiProject = createApiProject({ status: 'crawling' });
      const result = convertProject(apiProject);

      expect(result.status).toBe('processing');
    });

    it('should convert analyzing project to processing status', () => {
      const apiProject = createApiProject({ status: 'analyzing' });
      const result = convertProject(apiProject);

      expect(result.status).toBe('processing');
    });

    it('should convert generating project to processing status', () => {
      const apiProject = createApiProject({ status: 'generating' });
      const result = convertProject(apiProject);

      expect(result.status).toBe('processing');
    });

    it('should convert failed project correctly', () => {
      const apiProject = createApiProject({ status: 'failed' });
      const result = convertProject(apiProject);

      expect(result.status).toBe('failed');
    });

    it('should format project name correctly', () => {
      const apiProject = createApiProject({ sourceUrl: 'https://my-awesome-site.com' });
      const result = convertProject(apiProject);

      expect(result.name).toBe('My awesome site');
    });

    it('should handle project name with underscores', () => {
      const apiProject = createApiProject({ sourceUrl: 'https://my_awesome_site.com' });
      const result = convertProject(apiProject);

      expect(result.name).toBe('My awesome site');
    });

    it('should capitalize first letter of project name', () => {
      const apiProject = createApiProject({ sourceUrl: 'https://lowercase-site.com' });
      const result = convertProject(apiProject);

      expect(result.name.charAt(0)).toBe('L');
    });
  });
});

