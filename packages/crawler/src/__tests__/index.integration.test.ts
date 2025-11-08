/**
 * Integration tests for SiteCrawler
 * 
 * These tests use real Puppeteer to crawl the Devora website (https://devora-drab.vercel.app/).
 * They verify that the crawler works end-to-end with a real website.
 * 
 * Note: These tests require:
 * - Network access
 * - Puppeteer browsers installed
 * - The target website to be accessible
 * 
 * Run with: pnpm test packages/crawler -- index.integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SiteCrawler } from '../index.js';

describe('@genie/crawler - Integration Tests', () => {
  let crawler: SiteCrawler;
  const devoraUrl = 'https://devora-drab.vercel.app/';
  const testTimeout = 60_000; // 60 seconds for real network requests

  beforeEach(() => {
    crawler = new SiteCrawler();
  });

  afterEach(async () => {
    await crawler.close();
  });

  describe('Devora Website Crawling', () => {
    it('should crawl the Devora homepage successfully', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora',
        startUrl: devoraUrl,
        settings: {
          maxPages: 1,
        },
        maxConcurrency: 1,
        waitStrategy: 'networkidle0',
      });

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].url).toBe(devoraUrl);
      expect(result.pages[0].html).toBeTruthy();
      expect(result.pages[0].html.length).toBeGreaterThan(0);
      
      // Verify HTML contains expected content from Devora site
      // Based on the website content, it should contain "devora", "scaffold", etc.
      const html = result.pages[0].html.toLowerCase();
      expect(html).toContain('devora');
      expect(result.errors).toHaveLength(0);
    }, testTimeout);

    it('should extract metadata from Devora homepage', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora-metadata',
        startUrl: devoraUrl,
        settings: {
          maxPages: 1,
        },
        maxConcurrency: 1,
        waitStrategy: 'networkidle0',
      });

      expect(result.pages[0].title).toBeTruthy();
      // Devora site should have a title
      expect(result.pages[0].title!.length).toBeGreaterThan(0);
    }, testTimeout);

    it('should discover and crawl multiple pages from Devora site', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora-multi',
        startUrl: devoraUrl,
        settings: {
          maxPages: 3,
        },
        maxConcurrency: 2,
        waitStrategy: 'networkidle0',
      });

      expect(result.pages.length).toBeGreaterThanOrEqual(1);
      expect(result.pages.length).toBeLessThanOrEqual(3);
      
      // Verify all pages have required fields
      result.pages.forEach(page => {
        expect(page.url).toBeTruthy();
        expect(page.html).toBeTruthy();
        expect(page.html.length).toBeGreaterThan(0);
        expect(page.url).toMatch(/^https?:\/\//);
      });
      
      // Verify pages are unique
      const urls = result.pages.map(p => p.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
    }, testTimeout);

    it('should call progress callback during crawl', async () => {
      await crawler.init();
      
      const progressCalls: Array<{ currentPage: string; pagesDiscovered: number; progress: number }> = [];
      
      const result = await crawler.crawl({
        projectId: 'test-devora-progress',
        startUrl: devoraUrl,
        settings: {
          maxPages: 2,
        },
        maxConcurrency: 1,
        waitStrategy: 'networkidle0',
        onProgress: (progress) => {
          progressCalls.push(progress);
        },
      });

      // Should have received at least one progress update
      expect(progressCalls.length).toBeGreaterThan(0);
      
      // Verify progress structure
      progressCalls.forEach(progress => {
        expect(progress.currentPage).toBeTruthy();
        expect(progress.pagesDiscovered).toBeGreaterThan(0);
        expect(progress.progress).toBeGreaterThanOrEqual(0);
        expect(progress.progress).toBeLessThanOrEqual(100);
      });
      
      // Last progress should reflect final page count
      const lastProgress = progressCalls[progressCalls.length - 1];
      expect(lastProgress.pagesDiscovered).toBe(result.pages.length);
    }, testTimeout);

    it('should respect maxPages limit', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora-limit',
        startUrl: devoraUrl,
        settings: {
          maxPages: 2,
        },
        maxConcurrency: 2,
        waitStrategy: 'networkidle0',
      });

      expect(result.pages.length).toBeLessThanOrEqual(2);
    }, testTimeout);

    it('should extract links from Devora homepage', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora-links',
        startUrl: devoraUrl,
        settings: {
          maxPages: 1,
        },
        maxConcurrency: 1,
        waitStrategy: 'networkidle0',
      });

      const html = result.pages[0].html;
      
      // Devora site should have links (navigation, CTAs, etc.)
      // Based on the website, it has links like "Get Started", "View Docs", etc.
      expect(html).toMatch(/<a[^>]*href/i);
    }, testTimeout);

    it('should respect domain restrictions', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora-domain',
        startUrl: devoraUrl,
        settings: {
          maxPages: 5,
          includePatterns: [devoraUrl],
        },
        maxConcurrency: 2,
        waitStrategy: 'networkidle0',
      });

      // All crawled pages should be from the same domain
      const baseDomain = new URL(devoraUrl).hostname;
      result.pages.forEach(page => {
        const pageDomain = new URL(page.url).hostname;
        expect(pageDomain).toBe(baseDomain);
      });
    }, testTimeout);
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      await crawler.init();
      
      const result = await crawler.crawl({
        projectId: 'test-devora-error',
        startUrl: 'https://invalid-domain-that-does-not-exist-12345.com',
        settings: {
          maxPages: 1,
        },
        maxConcurrency: 1,
        waitStrategy: 'networkidle0',
      });

      // Should have errors but not crash
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.pages.length).toBe(0);
    }, testTimeout);
  });
});

