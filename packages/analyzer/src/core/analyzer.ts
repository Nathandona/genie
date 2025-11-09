import { z } from 'zod';
import type { ContentSlice, ThemeTokens } from '@genie/shared';

import { extractAllColors, type ColorPalette } from '../extractors/color-extractor.js';
import { parseHTMLString } from '../parsers/html-parser.js';
import { parseCSSString } from '../parsers/css-parser.js';
import {
  findHeroSections,
  type HeroCandidate
} from '../semantic-parsers/hero-parser.js';
import {
  findFeaturesSections,
  type FeaturesSectionCandidate
} from '../semantic-parsers/features-parser.js';
import {
  findPricingSections,
  type PricingSectionCandidate
} from '../semantic-parsers/pricing-parser.js';
import {
  findTestimonialsSections,
  type TestimonialsSectionCandidate
} from '../semantic-parsers/testimonials-parser.js';

export interface DesignTokenSummary {
  colors: string[];
  fonts: string[];
  spacingScale: number[];
  borderRadius?: number[];
  shadows?: string[];
  requiredComponents?: string[]; // shadcn components needed
}

export interface SemanticContent {
  hero?: {
    title?: string;
    subtitle?: string;
    description?: string;
    primaryButton?: { text: string; url?: string };
    secondaryButton?: { text: string; url?: string };
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  features?: {
    title?: string;
    subtitle?: string;
    features: Array<{
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
    }>;
  };
  pricing?: {
    title?: string;
    subtitle?: string;
    plans: Array<{
      name?: string;
      price?: string;
      period?: string;
      description?: string;
      features: string[];
      button?: { text: string; url?: string; highlighted?: boolean };
      popular?: boolean;
    }>;
  };
  testimonials?: {
    title?: string;
    subtitle?: string;
    testimonials: Array<{
      name?: string;
      role?: string;
      company?: string;
      content?: string;
      avatar?: string;
      rating?: number;
    }>;
  };
  navigation?: any; // Placeholder
  footer?: any; // Placeholder
  contact?: any; // Placeholder
  about?: any; // Placeholder
  stats?: any; // Placeholder
}

export interface AnalysisResult {
  designTokens: DesignTokenSummary;
  contentSlices: ContentSlice[];
  semanticContent: SemanticContent;
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

  // Extract semantic content from HTML
  const semanticContent = input.html ? extractSemanticContent(input.html) : {};

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
    semanticContent,
    themeTokens,
    colorPalette: colorAnalysis.palette
  };
};

// Alias for analyzeDesignSystem to maintain backward compatibility
export const analyzePage = analyzeDesignSystem;

/**
 * Extract semantic content from HTML using specialized parsers
 */
export function extractSemanticContent(html: string): SemanticContent {
  const semanticContent: SemanticContent = {};

  try {
    // Extract hero content
    const heroSections = findHeroSections(html);
    if (heroSections.length > 0) {
      const hero = heroSections[0];
      semanticContent.hero = {
        title: hero.title,
        subtitle: hero.subtitle,
        description: hero.description,
        primaryButton: hero.primaryButton,
        secondaryButton: hero.secondaryButton,
        backgroundImage: undefined, // Would need additional parsing
        backgroundVideo: undefined  // Would need additional parsing
      };
    }

    // Extract features content
    const featuresSections = findFeaturesSections(html);
    if (featuresSections.length > 0) {
      const featuresSection = featuresSections[0];
      semanticContent.features = {
        title: featuresSection.title,
        subtitle: featuresSection.subtitle,
        features: featuresSection.features.map(f => ({
          title: f.title,
          description: f.description,
          icon: f.icon,
          image: f.image
        }))
      };
    }

    // Extract pricing content
    const pricingSections = findPricingSections(html);
    if (pricingSections.length > 0) {
      const pricingSection = pricingSections[0];
      // Only include pricing content if we have at least one plan
      if (pricingSection.plans.length > 0) {
        semanticContent.pricing = {
          title: pricingSection.title,
          subtitle: pricingSection.subtitle,
          plans: pricingSection.plans.map(p => ({
            name: p.name,
            price: p.price,
            period: p.period,
            description: p.description,
            features: p.features,
            button: p.button,
            popular: p.popular
          }))
        };
      }
    }

    // Extract testimonials content
    const testimonialsSections = findTestimonialsSections(html);
    if (testimonialsSections.length > 0) {
      const testimonialsSection = testimonialsSections[0];
      // Only include testimonials content if we have at least one testimonial
      if (testimonialsSection.testimonials.length > 0) {
        semanticContent.testimonials = {
          title: testimonialsSection.title,
          subtitle: testimonialsSection.subtitle,
          testimonials: testimonialsSection.testimonials.map(t => ({
            name: t.name,
            role: t.role,
            company: t.company,
            content: t.content,
            avatar: t.avatar,
            rating: t.rating
          }))
        };
      }
    }

    // TODO: Add parsers for navigation, footer, contact, about, stats
    // These would follow similar patterns to the ones above

  } catch (error) {
    console.warn('Error extracting semantic content:', error);
    // Return empty semantic content on error to avoid breaking the analysis
  }

  return semanticContent;
}

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
