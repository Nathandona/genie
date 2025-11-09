import PQueue from 'p-queue';
import puppeteerCore from 'puppeteer-core';
import type { Browser, Page } from 'puppeteer-core';
import { z } from 'zod';
import * as cheerio from 'cheerio';

import type { ProjectSettings, NavigationLink, PageSummary } from '@genie/shared';

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
  waitStrategy: z.enum(['domcontentloaded', 'networkidle0', 'networkidle2', 'load']).default('networkidle0'),
  onProgress: z.function().args(z.object({
    currentPage: z.string(),
    pagesDiscovered: z.number(),
    progress: z.number()
  })).optional()
});

export type CrawlOptions = z.infer<typeof crawlOptionsSchema>;

export interface CrawlResult {
  pages: Array<{ 
    url: string; 
    html: string; 
    title?: string; 
    metaDescription?: string;
    navigation?: NavigationLink[];
    summary?: PageSummary;
  }>;
  navigation: NavigationLink[];
  errors: string[];
}

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

  private normalizeUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }

  private shouldIncludeUrl(url: string, settings: ProjectSettings, startUrl: string): boolean {
    try {
    const urlObj = new URL(url);
      const startUrlObj = new URL(startUrl);
      
      // Get the root origin (protocol + hostname + port if present)
      const rootOrigin = startUrlObj.origin;

      // Only crawl URLs that start with the root origin
      if (!url.startsWith(rootOrigin)) {
      return false;
    }

    // Check exclude patterns
    if (settings.excludePatterns) {
      for (const pattern of settings.excludePatterns) {
        if (url.includes(pattern)) {
          return false;
        }
      }
    }

      // Check include patterns (if provided, URL must match at least one)
    if (settings.includePatterns && settings.includePatterns.length > 0) {
        const matchesPattern = settings.includePatterns.some(pattern => url.includes(pattern));
        if (!matchesPattern) {
          return false;
        }
    }

    // Exclude common non-page URLs
      const excludeExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.json', '.xml', '.woff', '.woff2', '.ttf', '.eot', '.ico'];
    if (excludeExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
      return false;
    }

    return true;
    } catch {
      // Invalid URL, exclude it
      return false;
    }
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const $ = cheerio.load(html);
    const links: string[] = [];
    
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const normalized = this.normalizeUrl(href, baseUrl);
        if (normalized && normalized.startsWith('http')) {
          links.push(normalized);
        }
      }
    });

    return [...new Set(links)];
  }

  private extractMetadata(html: string): { title?: string; metaDescription?: string } {
    const $ = cheerio.load(html);
    return {
      title: $('title').text().trim() || undefined,
      metaDescription: $('meta[name="description"]').attr('content') || undefined
    };
  }

  private extractNavigation(html: string, baseUrl: string): NavigationLink[] {
    const $ = cheerio.load(html);
    const navLinks: NavigationLink[] = [];
    const seenUrls = new Set<string>();

    // Extract from nav elements
    $('nav a[href], header a[href], .navbar a[href], .navigation a[href]').each((index, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      
      if (href && text && text.length > 0 && text.length < 100) {
        try {
          const normalized = this.normalizeUrl(href, baseUrl);
          if (normalized && normalized.startsWith('http') && !seenUrls.has(normalized)) {
            seenUrls.add(normalized);
            navLinks.push({
              url: normalized,
              text: text,
              order: index
            });
          }
        } catch {
          // Skip invalid URLs
        }
      }
    });

    return navLinks.slice(0, 20); // Limit to top 20 navigation links
  }

  private extractPageSummary(html: string, url: string): PageSummary {
    const $ = cheerio.load(html);
    
    // Extract main heading (h1 or first h2)
    const mainHeading = $('h1').first().text().trim() || 
                       $('h2').first().text().trim() || 
                       undefined;

    // Extract content preview (first few paragraphs)
    const paragraphs: string[] = [];
    let paragraphCount = 0;
    $('main p, article p, .content p, body > p').each((_, el) => {
      if (paragraphCount >= 3) return; // Stop after 3 paragraphs
      const text = $(el).text().trim();
      if (text.length > 20 && text.length < 500) {
        paragraphs.push(text);
        paragraphCount++;
      }
    });
    
    const contentPreview = paragraphs.slice(0, 2).join(' ').substring(0, 300) || undefined;

    // Calculate word count
    const bodyText = $('body').text();
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

    return {
      url,
      title: $('title').text().trim() || undefined,
      metaDescription: $('meta[name="description"]').attr('content') || undefined,
      mainHeading,
      contentPreview,
      wordCount: wordCount > 0 ? wordCount : undefined
    };
  }

  async crawl(rawOptions: CrawlOptions): Promise<CrawlResult> {
    const options = crawlOptionsSchema.parse(rawOptions);
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
      if (!this.shouldIncludeUrl(url, options.settings, options.startUrl)) continue;

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
          const metadata = this.extractMetadata(html);
          const navigation = this.extractNavigation(html, url);
          const summary = this.extractPageSummary(html, url);
          
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
            summary
          });

          // Extract links for further crawling
          if (pages.length < maxPages) {
            const links = this.extractLinks(html, url);
            for (const link of links) {
              if (!visited.has(link) && this.shouldIncludeUrl(link, options.settings, options.startUrl)) {
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
