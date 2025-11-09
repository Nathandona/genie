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

export interface GeminiClient {
  generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse>;
}

export interface ContentGenerationRequest {
  pageSummary: PageSummary;
  contentSlices: ContentSlice[];
  themeTokens: ThemeTokens;
  templateStructure: string; // The shadcn template structure
  navigation?: Array<{ url: string; text: string }>;
}

export interface ContentGenerationResponse {
  generatedContent: string; // JSX/TSX content for the page
  metadata?: Record<string, unknown>;
}

export const createGeminiClient = (config: GeminiConfig): GeminiClient => {
  const parsed = geminiConfigSchema.parse(config);
  const genAI = new GoogleGenerativeAI(parsed.apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-exp',
    systemInstruction: `You are a React/Next.js developer expert. Generate production-ready JSX/TSX code for Next.js 16 App Router using shadcn/ui components.
Your output should be valid TypeScript React code that can be directly used in a Next.js page component.
Use Tailwind CSS classes for styling. Follow the provided template structure and incorporate the theme tokens.

IMPORTANT: Never use toast notifications or alert components. Focus on displaying content using cards, buttons, and other UI components for a clean, static design.

Return ONLY the JSX/TSX code without markdown code blocks or explanations.`
  });

  return {
    async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
      const prompt = buildContentGenerationPrompt(request);

      try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const generatedContent = response.text() || '';

        if (!generatedContent) {
          throw new Error('No content generated from Gemini');
        }

        // Clean up markdown code blocks if present
        const cleanedContent = generatedContent
          .replace(/^```(?:tsx?|jsx?)?\n/gm, '')
          .replace(/```$/gm, '')
          .trim();

        return {
          generatedContent: cleanedContent,
          metadata: {
            model: 'gemini-2.0-flash-exp',
            tokensUsed: response.usageMetadata?.totalTokenCount
          }
        };
      } catch (error) {
        console.error('Gemini content generation error:', error);
        throw error;
      }
    }
  };
};

function buildContentGenerationPrompt(request: ContentGenerationRequest): string {
  const { pageSummary, contentSlices, themeTokens, templateStructure, navigation } = request;

  const contentContext = contentSlices
    .slice(0, 20) // Limit to top 20 slices
    .map(slice => {
      switch (slice.type) {
        case 'heading':
          return `Heading (${slice.metadata?.level || 'h1'}): ${slice.content}`;
        case 'paragraph':
          return `Paragraph: ${slice.content}`;
        case 'list':
          return `List: ${slice.content}`;
        case 'quote':
          return `Quote: ${slice.content}`;
        case 'button':
          return `Button: ${slice.content}`;
        default:
          return `${slice.type}: ${slice.content}`;
      }
    })
    .join('\n\n');

  return `Generate a Next.js 16 page component using shadcn/ui components.

Page Information:
- Title: ${pageSummary.title || 'Untitled'}
- Main Heading: ${pageSummary.mainHeading || 'N/A'}
- Description: ${pageSummary.metaDescription || 'N/A'}
- Content Preview: ${pageSummary.contentPreview || 'N/A'}

Theme Tokens:
- Colors: ${themeTokens.colors.join(', ') || 'Default'}
- Fonts: ${themeTokens.fonts.join(', ') || 'System default'}
- Spacing Scale: ${themeTokens.spacingScale.slice(0, 10).join(', ') || 'Default'}
- Required Components: ${themeTokens.requiredComponents?.join(', ') || 'None'}

${navigation && navigation.length > 0 ? `Navigation Links:\n${navigation.map(link => `- ${link.text}: ${link.url}`).join('\n')}\n\n` : ''}

Original Content Context:
${contentContext || 'No specific content provided'}

Template Structure:
${templateStructure}

Generate a complete page component that:
1. Uses the provided shadcn/ui components from the template
2. Incorporates the theme tokens (colors, fonts, spacing)
3. Includes relevant content from the original page
4. Maintains semantic HTML structure
5. Uses Tailwind CSS classes
6. Is production-ready and follows Next.js 16 App Router conventions
7. NEVER uses toast notifications or alert components - focus on clean, static content display

Return ONLY the JSX/TSX code without any markdown formatting or explanations.`;
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
