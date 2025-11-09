/**
 * URL processing utilities for the crawler
 */

export class URLUtils {
  /**
   * Normalize a URL relative to a base URL
   */
  static normalizeUrl(url: string, baseUrl: string): string {
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if a URL should be included based on project settings
   */
  static shouldIncludeUrl(url: string, settings: any, startUrl: string): boolean {
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
        const matchesPattern = settings.includePatterns.some((pattern: string) => url.includes(pattern));
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
}
