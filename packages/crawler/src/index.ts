import PQueue from 'p-queue';
import puppeteer, { Browser } from 'puppeteer';
import { z } from 'zod';

import type { ProjectSettings } from '@frontgenie/shared';

const crawlOptionsSchema = z.object({
  projectId: z.string(),
  startUrl: z.string().url(),
  settings: z.custom<ProjectSettings>(),
  maxConcurrency: z.number().min(1).max(5).default(2)
});

export type CrawlOptions = z.infer<typeof crawlOptionsSchema>;

export interface CrawlResult {
  pages: Array<{ url: string; html: string }>;
  errors: string[];
}

export class SiteCrawler {
  #browser: Browser | null = null;
  #queue = new PQueue({ concurrency: 2 });

  async init() {
    if (!this.#browser) {
      this.#browser = await puppeteer.launch({ headless: 'shell' });
    }
  }

  async close() {
    await this.#queue.onIdle();
    if (this.#browser) {
      await this.#browser.close();
      this.#browser = null;
    }
  }

  async crawl(rawOptions: CrawlOptions): Promise<CrawlResult> {
    const options = crawlOptionsSchema.parse(rawOptions);
    await this.init();

    const visited = new Set<string>();
    const pages: CrawlResult['pages'] = [];
    const errors: string[] = [];

    const enqueue = (url: string) => {
      if (visited.has(url)) return;
      visited.add(url);
      this.#queue.add(async () => {
        if (!this.#browser) return;
        const page = await this.#browser.newPage();
        try {
          const response = await page.goto(url, { waitUntil: 'networkidle0', timeout: 30_000 });
          if (!response) throw new Error('No response received');
          await new Promise((resolve) => setTimeout(resolve, 500));
          const html = await page.content();
          pages.push({ url, html });
        } catch (err) {
          errors.push(`Failed to crawl ${url}: ${(err as Error).message}`);
        } finally {
          await page.close();
        }
      });
    };

    enqueue(options.startUrl);
    await this.#queue.onIdle();

    return { pages, errors };
  }
}
