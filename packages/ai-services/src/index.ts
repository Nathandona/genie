import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z } from 'zod';

const openAiConfigSchema = z.object({
  apiKey: z.string().min(1),
  organization: z.string().optional()
});

const anthropicConfigSchema = z.object({
  apiKey: z.string().min(1)
});

export type OpenAIConfig = z.infer<typeof openAiConfigSchema>;
export type AnthropicConfig = z.infer<typeof anthropicConfigSchema>;

export const createOpenAIClient = (config: OpenAIConfig) => {
  const parsed = openAiConfigSchema.parse(config);
  return new OpenAI({ apiKey: parsed.apiKey, organization: parsed.organization });
};

export const createAnthropicClient = (config: AnthropicConfig) => {
  const parsed = anthropicConfigSchema.parse(config);
  return new Anthropic({ apiKey: parsed.apiKey });
};

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
