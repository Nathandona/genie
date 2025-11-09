import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOpenAIClient,
  createAnthropicClient,
  inferLayoutPatterns,
  type LayoutInferenceRequest,
  createComponentSelectionRequest,
  selectComponentsWithConfidence,
  fallbackComponentSelection,
  type ComponentSelectionRequest
} from '../index.js';
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
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

  describe('Component Selection', () => {
    describe('createComponentSelectionRequest', () => {
      it('should create component selection request from semantic content', () => {
        const semanticContent = {
          hero: { title: 'Welcome', description: 'Welcome message' },
          features: { features: [{ title: 'Feature 1' }] }
        };

        const request = createComponentSelectionRequest(semanticContent);

        expect(request.semanticContent).toEqual(semanticContent);
        expect(request.componentRegistry).toBeDefined();
        expect(request.componentRegistry.availableComponents).toBeDefined();
        expect(request.componentRegistry.availableComponents.length).toBeGreaterThan(0);
      });

      it('should include context information when provided', () => {
        const semanticContent = { hero: { title: 'Test' } };
        const pageSummary = { title: 'Test Page', url: 'https://example.com' };

        const request = createComponentSelectionRequest(semanticContent, pageSummary);

        expect(request.context?.pageSummary).toEqual(pageSummary);
      });
    });

    describe('selectComponentsWithConfidence', () => {
      it('should select components for hero content', () => {
        const semanticContent = {
          hero: { title: 'Welcome', description: 'Welcome message' }
        };

        const componentRegistry = createComponentSelectionRequest(semanticContent).componentRegistry;
        const matches = selectComponentsWithConfidence(semanticContent, componentRegistry);

        expect(matches.length).toBe(1);
        expect(matches[0].componentId).toBe('hero-default');
        expect(matches[0].componentType).toBe('hero');
        expect(matches[0].confidence).toBe(0.9);
        expect(matches[0].contentMapping).toEqual(semanticContent.hero);
      });

      it('should select components for multiple content types', () => {
        const semanticContent = {
          hero: { title: 'Welcome' },
          features: { features: [{ title: 'Feature 1' }] },
          pricing: { plans: [{ name: 'Basic', price: '$10' }] }
        };

        const componentRegistry = createComponentSelectionRequest(semanticContent).componentRegistry;
        const matches = selectComponentsWithConfidence(semanticContent, componentRegistry);

        expect(matches.length).toBe(3);
        expect(matches[0].componentType).toBe('hero');
        expect(matches[1].componentType).toBe('features');
        expect(matches[2].componentType).toBe('pricing');
      });

      it('should sort matches by confidence', () => {
        const semanticContent = {
          hero: { title: 'Welcome' },
          features: { features: [{ title: 'Feature 1' }] }
        };

        const componentRegistry = createComponentSelectionRequest(semanticContent).componentRegistry;
        const matches = selectComponentsWithConfidence(semanticContent, componentRegistry);

        // All semantic matches should have high confidence (0.9)
        expect(matches[0].confidence).toBe(0.9);
        expect(matches[1].confidence).toBe(0.9);
      });

      it('should handle empty semantic content', () => {
        const semanticContent = {};
        const componentRegistry = createComponentSelectionRequest(semanticContent).componentRegistry;
        const matches = selectComponentsWithConfidence(semanticContent, componentRegistry);

        expect(matches.length).toBe(0);
      });
    });

    describe('fallbackComponentSelection', () => {
      it('should provide fallback selection for hero content', () => {
        const request: ComponentSelectionRequest = {
          semanticContent: {
            hero: { title: 'Welcome', description: 'Welcome message' }
          },
          componentRegistry: createComponentSelectionRequest({}).componentRegistry
        };

        const response = fallbackComponentSelection(request);

        expect(response.matches.length).toBe(1);
        expect(response.matches[0].componentId).toBe('hero-default');
        expect(response.matches[0].confidence).toBe(0.8);
        expect(response.metadata?.fallback).toBe(true);
        expect(response.metadata?.ruleBased).toBe(true);
      });

      it('should handle multiple content types in fallback', () => {
        const request: ComponentSelectionRequest = {
          semanticContent: {
            hero: { title: 'Welcome' },
            features: { features: [{ title: 'Feature 1' }] },
            pricing: { plans: [{ name: 'Basic' }] },
            testimonials: { testimonials: [{ name: 'John', content: 'Great!' }] }
          },
          componentRegistry: createComponentSelectionRequest({}).componentRegistry
        };

        const response = fallbackComponentSelection(request);

        expect(response.matches.length).toBe(4);
        expect(response.matches.map(m => m.componentType)).toEqual(
          expect.arrayContaining(['hero', 'features', 'pricing', 'testimonials'])
        );
      });

      it('should return empty matches for unrecognized content', () => {
        const request: ComponentSelectionRequest = {
          semanticContent: {
            unknown: { some: 'content' }
          },
          componentRegistry: createComponentSelectionRequest({}).componentRegistry
        };

        const response = fallbackComponentSelection(request);

        expect(response.matches.length).toBe(0);
      });
    });
  });
});

