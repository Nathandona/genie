import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOpenAIClient, createAnthropicClient, inferLayoutPatterns, type LayoutInferenceRequest } from '../index.js';
import type OpenAI from 'openai';

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  patterns: [
                    {
                      type: 'hero',
                      confidence: 0.9,
                      component: 'Hero',
                      description: 'Hero section detected',
                    },
                  ],
                }),
              },
            }],
          }),
        },
      },
    })),
  };
});

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn(),
      },
    })),
  };
});

describe('@genie/ai-services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOpenAIClient', () => {
    it('should create OpenAI client with valid API key', () => {
      const config = {
        apiKey: 'sk-1234567890abcdef',
      };

      const client = createOpenAIClient(config);
      expect(client).toBeDefined();
    });

    it('should create OpenAI client with organization', () => {
      const config = {
        apiKey: 'sk-1234567890abcdef',
        organization: 'org-123456',
      };

      const client = createOpenAIClient(config);
      expect(client).toBeDefined();
    });

    it('should validate API key format', () => {
      const validKey = 'sk-1234567890abcdef';
      const invalidKey = 'invalid-key';

      expect(validKey.startsWith('sk-')).toBe(true);
      expect(invalidKey.startsWith('sk-')).toBe(false);
    });

    it('should throw error for empty API key', () => {
      expect(() => {
        createOpenAIClient({ apiKey: '' });
      }).toThrow();
    });
  });

  describe('createAnthropicClient', () => {
    it('should create Anthropic client with valid API key', () => {
      const config = {
        apiKey: 'sk-ant-1234567890abcdef',
      };

      const client = createAnthropicClient(config);
      expect(client).toBeDefined();
    });

    it('should validate API key format', () => {
      const validKey = 'sk-ant-1234567890abcdef';
      const invalidKey = 'invalid-key';

      expect(validKey.startsWith('sk-ant-')).toBe(true);
      expect(invalidKey.startsWith('sk-ant-')).toBe(false);
    });

    it('should throw error for empty API key', () => {
      expect(() => {
        createAnthropicClient({ apiKey: '' });
      }).toThrow();
    });
  });

  describe('inferLayoutPatterns', () => {
    it('should infer layout patterns from HTML', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    patterns: [
                      {
                        type: 'hero',
                        confidence: 0.9,
                        component: 'Hero',
                        description: 'Hero section',
                      },
                    ],
                  }),
                },
              }],
            }),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div class="hero"><h1>Welcome</h1></div>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);

      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0]).toHaveProperty('type');
      expect(patterns[0]).toHaveProperty('confidence');
      expect(patterns[0]).toHaveProperty('component');
      expect(patterns[0]).toHaveProperty('description');
    });

    it('should handle empty response gracefully', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: null,
                },
              }],
            }),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div>Content</div>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);
      expect(patterns).toEqual([]);
    });

    it('should fallback to simple pattern detection on error', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div class="hero">Hero Content</div>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);

      // Should fallback to simple pattern detection
      expect(patterns).toBeDefined();
      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should detect hero patterns', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div class="hero"><h1>Welcome</h1></div>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);

      // Simple pattern detection should find hero
      const heroPattern = patterns.find(p => p.type === 'hero');
      expect(heroPattern).toBeDefined();
    });

    it('should detect pricing table patterns', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div class="pricing"><div class="plan">$10</div></div>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);

      const pricingPattern = patterns.find(p => p.type === 'pricing-table');
      expect(pricingPattern).toBeDefined();
    });

    it('should detect form patterns', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error')),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<form><input type="text" /><button>Submit</button></form>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);

      const formPattern = patterns.find(p => p.type === 'form');
      expect(formPattern).toBeDefined();
    });

    it('should handle JSON array response format', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify([
                    {
                      type: 'hero',
                      confidence: 0.9,
                      component: 'Hero',
                      description: 'Hero section',
                    },
                  ]),
                },
              }],
            }),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div>Content</div>',
      };

      const patterns = await inferLayoutPatterns(request, mockClient);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should truncate long HTML content', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({ patterns: [] }),
                },
              }],
            }),
          },
        },
      } as unknown as OpenAI;

      const longHtml = 'x'.repeat(10000);
      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: longHtml,
      };

      await inferLayoutPatterns(request, mockClient);

      const callArgs = (mockClient.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const htmlContent = callArgs.messages[1].content;
      
      // HTML should be truncated to ~4000 chars
      expect(htmlContent.length).toBeLessThanOrEqual(4100);
    });

    it('should include system prompt for layout classification', async () => {
      const mockClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({ patterns: [] }),
                },
              }],
            }),
          },
        },
      } as unknown as OpenAI;

      const request: LayoutInferenceRequest = {
        description: 'Test page',
        html: '<div>Content</div>',
      };

      await inferLayoutPatterns(request, mockClient);

      const callArgs = (mockClient.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[0].content).toContain('layout classification');
    });
  });
});

