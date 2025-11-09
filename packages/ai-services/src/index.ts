import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type { ContentSlice, ThemeTokens, PageSummary } from '@genie/shared';

const openAiConfigSchema = z.object({
  apiKey: z.string().min(1),
  organization: z.string().optional()
});

const anthropicConfigSchema = z.object({
  apiKey: z.string().min(1)
});

const geminiConfigSchema = z.object({
  apiKey: z.string().min(1)
});

export type OpenAIConfig = z.infer<typeof openAiConfigSchema>;
export type AnthropicConfig = z.infer<typeof anthropicConfigSchema>;
export type GeminiConfig = z.infer<typeof geminiConfigSchema>;

export const createOpenAIClient = (config: OpenAIConfig) => {
  const parsed = openAiConfigSchema.parse(config);
  return new OpenAI({ apiKey: parsed.apiKey, organization: parsed.organization });
};

export const createAnthropicClient = (config: AnthropicConfig) => {
  const parsed = anthropicConfigSchema.parse(config);
  return new Anthropic({ apiKey: parsed.apiKey });
};


// New component-based interfaces
export interface ComponentSelectionRequest {
  semanticContent: Record<string, unknown>; // Extracted semantic content from analyzer
  componentRegistry: ComponentRegistryInfo; // Available components
  context?: {
    pageSummary?: PageSummary;
    themeTokens?: ThemeTokens;
  };
}

export interface ComponentMatch {
  componentId: string;
  componentType: string;
  confidence: number; // 0-1 score
  reasoning: string;
  contentMapping: Record<string, unknown>; // How semantic content maps to component props
}

export interface ComponentSelectionResponse {
  matches: ComponentMatch[];
  metadata?: Record<string, unknown>;
}

export interface ComponentRegistryInfo {
  availableComponents: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    schema: Record<string, unknown>; // Zod schema info
  }>;
}

// Export new component selection functions
export { fallbackComponentSelection };


function buildComponentSelectionPrompt(request: ComponentSelectionRequest): string {
  const { semanticContent, componentRegistry, context } = request;

  const semanticContentStr = Object.entries(semanticContent)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
    .join('\n\n');

  const availableComponentsStr = componentRegistry.availableComponents
    .map(comp => `- ${comp.id} (${comp.type}): ${comp.description}`)
    .join('\n');

  return `You are a component selection engine for Genie. Analyze the extracted semantic content from a website and select the best UI components from our registry to represent that content.

Semantic Content Extracted from Website:
${semanticContentStr || 'No semantic content extracted'}

Available UI Components:
${availableComponentsStr}

Context Information:
${context?.pageSummary ? `Page: ${context.pageSummary.title || 'Untitled'}` : ''}
${context?.themeTokens ? `Theme: ${context.themeTokens.colors.join(', ')}` : ''}

Task: For each piece of semantic content, select the most appropriate component from our registry. Consider:
1. Content type and structure match
2. Component purpose and capabilities
3. How well the content fits the component's interface

Return a JSON object with this structure:
{
  "matches": [
    {
      "componentId": "hero-default",
      "componentType": "hero",
      "confidence": 0.95,
      "reasoning": "This hero section has title, subtitle, and buttons that perfectly match the hero component interface",
      "contentMapping": {
        "title": "Welcome to Our Platform",
        "subtitle": "subtitle from semantic content",
        "description": "description from semantic content",
        "primaryButton": {"text": "Get Started", "url": "/signup"}
      }
    }
  ]
}

Guidelines:
- confidence should be 0-1 (higher for better matches)
- Only include matches with confidence > 0.3
- contentMapping should show how semantic content maps to component props
- reasoning should explain why this component was selected
- Return only valid JSON, no markdown formatting`;
}

function fallbackComponentSelection(request: ComponentSelectionRequest): ComponentSelectionResponse {
  const { semanticContent } = request;
  const matches: ComponentMatch[] = [];

  // Rule-based fallback selection
  if (semanticContent.hero) {
    matches.push({
      componentId: 'hero-default',
      componentType: 'hero',
      confidence: 0.8,
      reasoning: 'Hero content detected, using default hero component',
      contentMapping: semanticContent.hero as Record<string, unknown>
    });
  }

  if (semanticContent.features) {
    matches.push({
      componentId: 'features-grid',
      componentType: 'features',
      confidence: 0.8,
      reasoning: 'Features content detected, using grid layout component',
      contentMapping: semanticContent.features as Record<string, unknown>
    });
  }

  if (semanticContent.pricing) {
    matches.push({
      componentId: 'pricing-cards',
      componentType: 'pricing',
      confidence: 0.8,
      reasoning: 'Pricing content detected, using card layout component',
      contentMapping: semanticContent.pricing as Record<string, unknown>
    });
  }

  if (semanticContent.testimonials) {
    matches.push({
      componentId: 'testimonials-grid',
      componentType: 'testimonials',
      confidence: 0.8,
      reasoning: 'Testimonials content detected, using grid layout component',
      contentMapping: semanticContent.testimonials as Record<string, unknown>
    });
  }

  return {
    matches,
    metadata: { fallback: true, ruleBased: true }
  };
}

/**
 * Utility function to create a ComponentSelectionRequest from analysis results
 */
export function createComponentSelectionRequest(
  semanticContent: Record<string, unknown>,
  pageSummary?: PageSummary,
  themeTokens?: ThemeTokens
): ComponentSelectionRequest {
  // Import component registry info dynamically to avoid circular dependencies
  const componentRegistry: ComponentRegistryInfo = {
    availableComponents: [
      { id: 'hero-default', type: 'hero', name: 'Hero Section', description: 'Main hero section with title and CTA', schema: {} },
      { id: 'features-grid', type: 'features', name: 'Features Grid', description: 'Grid layout for feature highlights', schema: {} },
      { id: 'pricing-cards', type: 'pricing', name: 'Pricing Cards', description: 'Pricing plans in card format', schema: {} },
      { id: 'testimonials-grid', type: 'testimonials', name: 'Testimonials Grid', description: 'Customer testimonials in grid', schema: {} },
      { id: 'footer-multi-column', type: 'footer', name: 'Footer', description: 'Multi-column footer with links', schema: {} },
      { id: 'navigation-horizontal', type: 'navigation', name: 'Navigation', description: 'Horizontal navigation bar', schema: {} },
      { id: 'contact-form-left', type: 'contact', name: 'Contact Form', description: 'Contact form with company info', schema: {} },
      { id: 'about-split', type: 'about', name: 'About Section', description: 'About section with image and content', schema: {} },
      { id: 'stats-grid', type: 'stats', name: 'Stats Grid', description: 'Statistics and metrics display', schema: {} }
    ]
  };

  return {
    semanticContent,
    componentRegistry,
    context: {
      pageSummary,
      themeTokens
    }
  };
}

/**
 * Enhanced component selection with confidence scoring
 */
export function selectComponentsWithConfidence(
  semanticContent: Record<string, unknown>,
  availableComponents: ComponentRegistryInfo
): ComponentMatch[] {
  const matches: ComponentMatch[] = [];

  // Direct mapping for known semantic content types
  const contentTypeMappings = {
    hero: 'hero-default',
    features: 'features-grid',
    pricing: 'pricing-cards',
    testimonials: 'testimonials-grid',
    navigation: 'navigation-horizontal',
    footer: 'footer-multi-column',
    contact: 'contact-form-left',
    about: 'about-split',
    stats: 'stats-grid'
  };

  Object.entries(semanticContent).forEach(([contentType, content]) => {
    if (content && contentTypeMappings[contentType as keyof typeof contentTypeMappings]) {
      const componentId = contentTypeMappings[contentType as keyof typeof contentTypeMappings];
      const component = availableComponents.availableComponents.find(c => c.id === componentId);

      if (component) {
        matches.push({
          componentId,
          componentType: contentType,
          confidence: 0.9, // High confidence for direct semantic matches
          reasoning: `Direct match: ${contentType} content maps perfectly to ${component.name}`,
          contentMapping: content as Record<string, unknown>
        });
      }
    }
  });

  // Sort by confidence
  return matches.sort((a, b) => b.confidence - a.confidence);
}

export interface LayoutInferenceRequest {
  description: string;
  html: string;
}

                                                                                                                                                                                                                                                                                                                          export interface LayoutPattern {
  type: string;
  confidence: number;
  component: string;
  description: string;
}

export const inferLayoutPatterns = async (
  request: LayoutInferenceRequest,
  client: OpenAI
): Promise<LayoutPattern[]> => {
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a layout classification engine for Genie. Analyze HTML snippets and identify layout patterns. 
          Return a JSON array of patterns with: type (hero, feature-grid, pricing-table, testimonial, form, gallery, etc.), 
          confidence (0-1), component (suggested shadcn/ui component), and description.`
        },
        {
          role: 'user',
          content: `Analyze this HTML snippet and identify layout patterns:\n\n${request.html.substring(0, 4000)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    return Array.isArray(parsed.patterns) ? parsed.patterns : Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Layout inference error:', error);
    // Fallback: simple pattern detection
    return detectSimplePatterns(request.html);
  }
};

function detectSimplePatterns(html: string): LayoutPattern[] {
  const patterns: LayoutPattern[] = [];
  const lowerHtml = html.toLowerCase();

  if (lowerHtml.includes('hero') || lowerHtml.includes('banner') || lowerHtml.includes('jumbotron')) {
    patterns.push({
      type: 'hero',
      confidence: 0.7,
      component: 'Hero',
      description: 'Hero section detected'
    });
  }

  if (lowerHtml.includes('pricing') || lowerHtml.includes('price') || lowerHtml.includes('plan')) {
    patterns.push({
      type: 'pricing-table',
      confidence: 0.7,
      component: 'Card',
      description: 'Pricing section detected'
    });
  }

  if (lowerHtml.includes('testimonial') || lowerHtml.includes('review') || lowerHtml.includes('quote')) {
    patterns.push({
      type: 'testimonial',
      confidence: 0.6,
      component: 'Card',
      description: 'Testimonial section detected'
    });
  }

  if (lowerHtml.includes('<form') || lowerHtml.includes('input') || lowerHtml.includes('button')) {
    patterns.push({
      type: 'form',
      confidence: 0.8,
      component: 'Form',
      description: 'Form detected'
    });
  }

  return patterns;
}
