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

export const inferLayoutPatterns = async (
  request: LayoutInferenceRequest,
  client: OpenAI
): Promise<string[]> => {
  const completion = await client.responses.create({
    model: 'gpt-4.1-mini',
    input: [
      {
        role: 'system',
        content: 'You are a layout classification engine for FrontGenie.'
      },
      {
        role: 'user',
        content: `Classify the layout sections in the following HTML snippet:\n${request.html}`
      }
    ]
  });

  const output = completion.output_text ?? '';
  return output
    .split('\n')
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0);
};
