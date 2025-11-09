import * as cheerio from 'cheerio';
import type { NavigationLink, PageSummary } from '@genie/shared';

/**
 * Extractors for metadata, navigation, and page summaries
 */
export class MetadataExtractor {
  /**
   * Extract basic metadata from HTML
   */
  static extractMetadata(html: string): { title?: string; metaDescription?: string } {
    const $ = cheerio.load(html);
    return {
      title: $('title').text().trim() || undefined,
      metaDescription: $('meta[name="description"]').attr('content') || undefined
    };
  }

  /**
   * Extract navigation links from HTML
   */
  static extractNavigation(html: string, baseUrl: string): NavigationLink[] {
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

  /**
   * Extract page summary information
   */
  static extractPageSummary(html: string, url: string): PageSummary {
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

  /**
   * Extract links from HTML for crawling
   */
  static extractLinks(html: string, baseUrl: string): string[] {
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

  /**
   * Normalize a URL relative to a base URL
   */
  private static normalizeUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }
}
