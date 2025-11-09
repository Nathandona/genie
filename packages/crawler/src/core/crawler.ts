import PQueue from 'p-queue';
import puppeteerCore from 'puppeteer-core';
import type { Browser, Page } from 'puppeteer-core';
import { z } from 'zod';

import type { ProjectSettings, NavigationLink } from '@genie/shared';
import type { CrawlOptions, CrawlResult } from '../types.js';
import { URLUtils } from '../utils/url-utils.js';
import { MetadataExtractor } from '../extractors/metadata-extractor.js';
import { CSSExtractor } from '../extractors/css-extractor.js';

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1';

// Lazy load chromium for Vercel (only when needed)
async function getChromium() {
  if (isVercel) {
    const chromium = await import('@sparticuz/chromium');
    return chromium.default;
  }
  return null;
}

const crawlOptionsSchema = z.object({
  projectId: z.string(),
  startUrl: z.string().url(),
  settings: z.custom<ProjectSettings>(),
  maxConcurrency: z.number().min(1).max(5).default(2),
  waitStrategy: z.enum(['domcontentloaded', 'networkidle0', 'networkidle2', 'load']).default('networkidle0')
});

export class SiteCrawler {
  #browser: Browser | null = null;
  #queue: PQueue | null = null;

  async init() {
    if (!this.#browser) {
      if (isVercel) {
        // Use @sparticuz/chromium for Vercel serverless functions
        const chromium = await getChromium();
        if (!chromium) {
          throw new Error('Chromium not available on Vercel');
        }

        this.#browser = await puppeteerCore.launch({
          args: chromium.args || [],
          defaultViewport: { width: 1920, height: 1080 },
          executablePath: await chromium.executablePath(),
          headless: true,
        }) as unknown as Browser;
      } else {
        // Use regular Puppeteer for local development
        const puppeteer = await import('puppeteer');
        const browser = await puppeteer.default.launch({
        headless: 'shell',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ],
        protocolTimeout: 120_000, // 2 minutes
        timeout: 60_000 // 1 minute for browser launch
      });
        this.#browser = browser as unknown as Browser;
      }
    }
  }

  async close() {
    if (this.#queue) {
      await this.#queue.onIdle();
    }
    if (this.#browser) {
      await this.#browser.close();
      this.#browser = null;
    }
  }

  async crawl(rawOptions: CrawlOptions): Promise<CrawlResult> {
    const { onProgress, ...coreOptions } = rawOptions;
    const options = { ...crawlOptionsSchema.parse(coreOptions), onProgress };
    await this.init();

    const maxPages = options.settings.maxPages ?? 10;
    const concurrency = options.maxConcurrency ?? 2;
    this.#queue = new PQueue({ concurrency });

    const visited = new Set<string>();
    const toVisit: string[] = [options.startUrl];
    const pages: CrawlResult['pages'] = [];
    const errors: string[] = [];
    const baseUrl = new URL(options.startUrl);
    const globalNavigation = new Map<string, NavigationLink>();

    // Handle authentication if provided
    if (options.settings.authentication) {
      const page = await this.#browser!.newPage();
      page.setDefaultNavigationTimeout(60_000);
      page.setDefaultTimeout(60_000);
      try {
        await page.goto(options.startUrl, {
          waitUntil: options.waitStrategy ?? 'networkidle0',
          timeout: 60_000
        });
        // Simple form-based auth (can be extended)
        await page.type('input[type="email"], input[name="email"], input[name="username"]', options.settings.authentication.username);
        await page.type('input[type="password"], input[name="password"]', options.settings.authentication.password);
        await page.click('button[type="submit"], input[type="submit"]');
        await page.waitForNavigation({ waitUntil: options.waitStrategy ?? 'networkidle0' });
      } catch (err) {
        errors.push(`Authentication failed: ${(err as Error).message}`);
      } finally {
        await page.close();
      }
    }

    while (toVisit.length > 0 && pages.length < maxPages) {
      const url = toVisit.shift()!;

      if (visited.has(url)) continue;
      if (!URLUtils.shouldIncludeUrl(url, options.settings, options.startUrl)) continue;

      visited.add(url);

      await this.#queue.add(async () => {
        if (!this.#browser || pages.length >= maxPages) return;

        const page = await this.#browser.newPage();
        page.setDefaultNavigationTimeout(60_000);
        page.setDefaultTimeout(60_000);
        try {
          const response = await page.goto(url, {
            waitUntil: options.waitStrategy ?? 'networkidle0',
            timeout: 60_000
          });

          if (!response || !response.ok()) {
            throw new Error(`HTTP ${response?.status() ?? 'unknown'}`);
          }

          // Wait a bit for dynamic content
          await new Promise((resolve) => setTimeout(resolve, 500));

          const html = await page.content();
          const metadata = MetadataExtractor.extractMetadata(html);
          const navigation = MetadataExtractor.extractNavigation(html, url);
          const summary = MetadataExtractor.extractPageSummary(html, url);
          const css = await CSSExtractor.extractCSSData(page, url);

          // Collect navigation links globally
          navigation.forEach(link => {
            if (!globalNavigation.has(link.url)) {
              globalNavigation.set(link.url, link);
            }
          });

          pages.push({
            url,
            html,
            title: metadata.title,
            metaDescription: metadata.metaDescription,
            navigation,
            summary,
            css
          });

          // Extract links for further crawling
          if (pages.length < maxPages) {
            const links = MetadataExtractor.extractLinks(html, url);
            for (const link of links) {
              if (!visited.has(link) && URLUtils.shouldIncludeUrl(link, options.settings, options.startUrl)) {
                toVisit.push(link);
              }
            }
          }

          // Report progress
          if (options.onProgress) {
            const progress = Math.min(100, Math.round((pages.length / maxPages) * 100));
            options.onProgress({
              currentPage: url,
              pagesDiscovered: pages.length,
              progress
            });
          }
        } catch (err) {
          errors.push(`Failed to crawl ${url}: ${(err as Error).message}`);
        } finally {
          await page.close();
        }
      });
    }

    await this.#queue.onIdle();

    return {
      pages,
      navigation: Array.from(globalNavigation.values()),
      errors
    };
  }
}
