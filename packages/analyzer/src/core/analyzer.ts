import { z } from 'zod';
import type { ContentSlice, ThemeTokens } from '@genie/shared';

import { extractAllColors, type ColorPalette } from '../extractors/color-extractor.js';
import { parseHTMLString } from '../parsers/html-parser.js';
import { parseCSSString } from '../parsers/css-parser.js';

export interface DesignTokenSummary {
  colors: string[];
  fonts: string[];
  spacingScale: number[];
  borderRadius?: number[];
  shadows?: string[];
  requiredComponents?: string[]; // shadcn components needed
}

export interface AnalysisResult {
  designTokens: DesignTokenSummary;
  contentSlices: ContentSlice[];
  themeTokens: ThemeTokens;
  colorPalette?: ColorPalette;
}

const analyzerInputSchema = z.object({
  html: z.string().optional(),
  css: z.string().optional()
});

export const analyzeDesignTokens = (input: z.infer<typeof analyzerInputSchema>): DesignTokenSummary => {
  const { html, css } = analyzerInputSchema.parse(input);

  const colors = new Set<string>();
  const fonts = new Set<string>();
  const spacing = new Set<number>();
  const borderRadius = new Set<number>();
  const shadows = new Set<string>();
  const requiredComponents = new Set<string>();

  // Extract from HTML inline styles and style tags
  if (html) {
    parseHTMLString(html, colors, fonts, spacing, borderRadius, shadows, requiredComponents);
  }

  // Extract from standalone CSS
  if (css) {
    parseCSSString(css, colors, fonts, spacing, borderRadius, shadows);
  }

  // Also use the new comprehensive color extraction to enhance the colors
  const colorAnalysis = extractAllColors(html, css);
  // Merge the colors from both approaches
  colorAnalysis.rawColors.forEach(color => colors.add(color));

  return {
    colors: Array.from(colors).slice(0, 12).sort(),
    fonts: Array.from(fonts),
    spacingScale: Array.from(spacing).sort((a, b) => a - b),
    borderRadius: Array.from(borderRadius).sort((a, b) => a - b),
    shadows: Array.from(shadows).slice(0, 10),
    requiredComponents: Array.from(requiredComponents)
  };
};

export const analyzeDesignSystem = (input: z.infer<typeof analyzerInputSchema>): AnalysisResult => {
  const designTokens = analyzeDesignTokens(input);
  const colorAnalysis = extractAllColors(input.html, input.css);

  // Create basic content slices from HTML if provided
  const contentSlices: ContentSlice[] = [];
  if (input.html) {
    // Simple content slice extraction - this could be enhanced
    const slices = extractContentSlices(input.html);
    contentSlices.push(...slices);
  }

  // Generate theme tokens from color palette
  const themeTokens: ThemeTokens = {
    colors: colorAnalysis.palette.primary,
    fonts: designTokens.fonts,
    spacingScale: designTokens.spacingScale,
    borderRadius: designTokens.borderRadius,
    shadows: designTokens.shadows,
    requiredComponents: designTokens.requiredComponents
  };

  return {
    designTokens,
    contentSlices,
    themeTokens,
    colorPalette: colorAnalysis.palette
  };
};

// Alias for analyzeDesignSystem to maintain backward compatibility
export const analyzePage = analyzeDesignSystem;

export function extractContentSlices(html: string): ContentSlice[] {
  // Simple content slice extraction - this could be much more sophisticated
  const slices: ContentSlice[] = [];

  // Extract headings
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1]);
    const content = match[2].replace(/<[^>]*>/g, '').trim();
    if (content) {
      slices.push({
        type: 'heading',
        content,
        metadata: { level }
      });
    }
  }

  // Extract paragraphs
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  while ((match = paragraphRegex.exec(html)) !== null) {
    const content = match[1].replace(/<[^>]*>/g, '').trim();
    if (content && content.length > 10) { // Only meaningful paragraphs
      slices.push({
        type: 'paragraph',
        content,
        metadata: {}
      });
    }
  }

  // Extract links
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();
    if (text && url !== '#') {
      slices.push({
        type: 'link',
        content: text,
        metadata: { url }
      });
    }
  }

  // Limit to top 50 slices to avoid overwhelming the AI
  return slices.slice(0, 50);
}
