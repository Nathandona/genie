import type { Page } from 'puppeteer-core';
import type { CSSData } from '@genie/shared';

/**
 * CSS data extraction utilities
 */
export class CSSExtractor {
  /**
   * Extract comprehensive CSS data from a page
   */
  static async extractCSSData(page: Page, baseUrl: string): Promise<CSSData> {
    const cssData: CSSData = {
      linkedStylesheets: [],
      inlineStyles: [],
      cssVariables: {},
      fontFaces: []
    };

    try {
      // Extract linked stylesheets
      const linkedStylesheets = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        return links.map(link => ({
          href: link.getAttribute('href') || '',
          media: link.getAttribute('media') || undefined
        }));
      });

      // Normalize stylesheet URLs and attempt to fetch content
      for (const stylesheet of linkedStylesheets) {
        try {
          const normalizedHref = this.normalizeUrl(stylesheet.href, baseUrl);
          if (normalizedHref) {
            // Try to fetch CSS content (with timeout)
            const response = await page.evaluate(async (url) => {
              try {
                const response = await fetch(url, { method: 'GET' });
                if (response.ok) {
                  return await response.text();
                }
              } catch {
                // Ignore fetch errors
              }
              return null;
            }, normalizedHref);

            cssData.linkedStylesheets.push({
              href: normalizedHref,
              media: stylesheet.media,
              content: response || undefined
            });
          }
        } catch (error) {
          // Continue with other stylesheets if one fails
          console.warn(`Failed to fetch CSS from ${stylesheet.href}:`, error);
        }
      }

      // Extract inline styles
      const inlineStyles = await page.evaluate(() => {
        const styles = Array.from(document.querySelectorAll('style'));
        return styles.map(style => style.textContent || '');
      });
      cssData.inlineStyles = inlineStyles.filter(style => style.trim().length > 0);

      // Extract CSS variables from :root
      const cssVariables = await page.evaluate(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const variables: Record<string, string> = {};

        // Get all CSS custom properties
        for (let i = 0; i < rootStyles.length; i++) {
          const property = rootStyles[i];
          if (property.startsWith('--')) {
            variables[property] = rootStyles.getPropertyValue(property).trim();
          }
        }

        return variables;
      });
      cssData.cssVariables = cssVariables;

      // Extract @font-face declarations from all CSS
      const allCSS = [
        ...cssData.inlineStyles,
        ...cssData.linkedStylesheets.map(s => s.content || '').filter(Boolean)
      ].join('\n');

      // Simple regex to extract font-face declarations
      const fontFaceRegex = /@font-face\s*{([^}]+)}/gi;
      let match;
      while ((match = fontFaceRegex.exec(allCSS)) !== null) {
        const fontFaceBlock = match[1];
        const familyMatch = fontFaceBlock.match(/font-family:\s*['"]?([^;'"]+)['"]?/i);
        const srcMatch = fontFaceBlock.match(/src:\s*([^;]+)/i);
        const weightMatch = fontFaceBlock.match(/font-weight:\s*([^;]+)/i);
        const styleMatch = fontFaceBlock.match(/font-style:\s*([^;]+)/i);

        if (familyMatch && srcMatch) {
          cssData.fontFaces.push({
            family: familyMatch[1].trim(),
            src: srcMatch[1].trim(),
            weight: weightMatch ? weightMatch[1].trim() : undefined,
            style: styleMatch ? styleMatch[1].trim() : undefined
          });
        }
      }

    } catch (error) {
      console.warn('Error extracting CSS data:', error);
      // Return partial data or empty structure on error
    }

    return cssData;
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
