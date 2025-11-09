import { describe, it, expect } from 'vitest';
import {
  PROJECT_STATUSES,
  PIPELINE_PHASES,
  type ProjectStatus,
  type ProjectSettings,
  type CrawlProgress,
  type ComponentMatch,
  type ComponentSelectionResult,
  type SemanticContent,
  type ComponentRegistryInfo,
  type ComponentSelectionRequest,
  type PipelinePhase,
  type PipelineProgress,
  type AnalysisResult
} from '../index.js';

describe('@genie/shared', () => {
  describe('PROJECT_STATUSES', () => {
    it('should export PROJECT_STATUSES constant', () => {
      expect(PROJECT_STATUSES).toBeDefined();
      expect(Array.isArray(PROJECT_STATUSES)).toBe(true);
    });

    it('should contain all expected status values', () => {
      const expectedStatuses = ['queued', 'crawling', 'analyzing', 'generating', 'completed', 'failed'];
      
      expectedStatuses.forEach(status => {
        expect(PROJECT_STATUSES).toContain(status);
      });
    });

    it('should be a readonly array', () => {
      expect(PROJECT_STATUSES.length).toBe(6);
    });
  });

  describe('ProjectStatus type', () => {
    it('should accept valid status values', () => {
      const validStatuses: ProjectStatus[] = [
        'queued',
        'crawling',
        'analyzing',
        'generating',
        'completed',
        'failed',
      ];

      validStatuses.forEach(status => {
        expect(PROJECT_STATUSES).toContain(status);
      });
    });

    it('should match PROJECT_STATUSES values', () => {
      const status: ProjectStatus = 'queued';
      expect(PROJECT_STATUSES).toContain(status);
    });
  });

  describe('ProjectSettings interface', () => {
    it('should accept valid project settings', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
      };

      expect(settings.maxPages).toBe(10);
    });

    it('should accept settings with include patterns', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
        includePatterns: ['https://example.com'],
      };

      expect(settings.includePatterns).toBeDefined();
      expect(settings.includePatterns?.length).toBe(1);
      expect(settings.includePatterns?.[0]).toBe('https://example.com');
    });

    it('should accept settings with exclude patterns', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
        excludePatterns: ['/admin', '/private'],
      };

      expect(settings.excludePatterns).toBeDefined();
      expect(settings.excludePatterns?.length).toBe(2);
      expect(settings.excludePatterns).toContain('/admin');
      expect(settings.excludePatterns).toContain('/private');
    });

    it('should accept settings with authentication', () => {
      const settings: ProjectSettings = {
        maxPages: 10,
        authentication: {
          username: 'test@example.com',
          password: 'password123',
        },
      };

      expect(settings.authentication).toBeDefined();
      expect(settings.authentication?.username).toBe('test@example.com');
      expect(settings.authentication?.password).toBe('password123');
    });

    it('should accept complete settings object', () => {
      const settings: ProjectSettings = {
        maxPages: 20,
        includePatterns: ['https://example.com'],
        excludePatterns: ['/admin'],
        authentication: {
          username: 'user@example.com',
          password: 'secret',
        },
      };

      expect(settings.maxPages).toBe(20);
      expect(settings.includePatterns).toBeDefined();
      expect(settings.excludePatterns).toBeDefined();
      expect(settings.authentication).toBeDefined();
    });
  });

  describe('CrawlProgress interface', () => {
    it('should accept valid crawl progress', () => {
      const progress: CrawlProgress = {
        projectId: 'test-project-123',
        status: 'crawling',
        progress: 50,
        pagesDiscovered: 5,
        errors: [],
      };

      expect(progress.projectId).toBe('test-project-123');
      expect(progress.status).toBe('crawling');
      expect(progress.progress).toBe(50);
      expect(progress.pagesDiscovered).toBe(5);
      expect(progress.errors).toEqual([]);
    });

    it('should accept progress with current page', () => {
      const progress: CrawlProgress = {
        projectId: 'test-project-123',
        status: 'crawling',
        progress: 30,
        currentPage: 'https://example.com/page1',
        pagesDiscovered: 3,
        errors: [],
      };

      expect(progress.currentPage).toBe('https://example.com/page1');
    });

    it('should accept progress with errors', () => {
      const progress: CrawlProgress = {
        projectId: 'test-project-123',
        status: 'crawling',
        progress: 40,
        pagesDiscovered: 4,
        errors: ['Failed to crawl https://example.com/bad-page'],
      };

      expect(progress.errors.length).toBe(1);
      expect(progress.errors[0]).toContain('Failed to crawl');
    });

    it('should accept all status values', () => {
      const statuses: ProjectStatus[] = ['queued', 'crawling', 'analyzing', 'generating', 'completed', 'failed'];
      
      statuses.forEach(status => {
        const progress: CrawlProgress = {
          projectId: 'test-project',
          status,
          progress: 0,
          pagesDiscovered: 0,
          errors: [],
        };

        expect(progress.status).toBe(status);
      });
    });

    it('should handle progress at different stages', () => {
      const queuedProgress: CrawlProgress = {
        projectId: 'test-project',
        status: 'queued',
        progress: 0,
        pagesDiscovered: 0,
        errors: [],
      };

      const completedProgress: CrawlProgress = {
        projectId: 'test-project',
        status: 'completed',
        progress: 100,
        pagesDiscovered: 10,
        errors: [],
      };

      expect(queuedProgress.progress).toBe(0);
      expect(completedProgress.progress).toBe(100);
      expect(completedProgress.pagesDiscovered).toBe(10);
    });
  });

  describe('Type exports', () => {
    it('should export all required types', () => {
      // Type checking test - if this compiles, types are exported correctly
      const status: ProjectStatus = 'queued';
      const settings: ProjectSettings = { maxPages: 10 };
      const progress: CrawlProgress = {
        projectId: 'test',
        status: 'crawling',
        progress: 0,
        pagesDiscovered: 0,
        errors: [],
      };

      expect(status).toBeDefined();
      expect(settings).toBeDefined();
      expect(progress).toBeDefined();
    });
  });

  describe('PIPELINE_PHASES', () => {
    it('should export PIPELINE_PHASES constant', () => {
      expect(PIPELINE_PHASES).toBeDefined();
      expect(Array.isArray(PIPELINE_PHASES)).toBe(true);
    });

    it('should contain all expected pipeline phases', () => {
      const expectedPhases = ['extraction', 'analysis', 'selection', 'generation', 'finalization'];

      expectedPhases.forEach(phase => {
        expect(PIPELINE_PHASES).toContain(phase);
      });
    });

    it('should have correct length', () => {
      expect(PIPELINE_PHASES.length).toBe(5);
    });
  });

  describe('ComponentMatch interface', () => {
    it('should accept valid component match', () => {
      const match: ComponentMatch = {
        componentId: 'hero-default',
        componentType: 'hero',
        confidence: 0.9,
        reasoning: 'Direct match for hero content',
        contentMapping: {
          title: 'Welcome',
          description: 'Welcome message'
        }
      };

      expect(match.componentId).toBe('hero-default');
      expect(match.componentType).toBe('hero');
      expect(match.confidence).toBe(0.9);
      expect(match.reasoning).toContain('Direct match');
      expect(match.contentMapping.title).toBe('Welcome');
    });

    it('should accept component match with minimal data', () => {
      const match: ComponentMatch = {
        componentId: 'test-component',
        componentType: 'test',
        confidence: 0.5,
        reasoning: 'Test match',
        contentMapping: {}
      };

      expect(match.componentId).toBe('test-component');
      expect(match.confidence).toBe(0.5);
    });

    it('should accept high confidence matches', () => {
      const match: ComponentMatch = {
        componentId: 'features-grid',
        componentType: 'features',
        confidence: 1.0,
        reasoning: 'Perfect match',
        contentMapping: {
          features: [{ title: 'Feature 1' }]
        }
      };

      expect(match.confidence).toBe(1.0);
      expect(match.componentType).toBe('features');
    });
  });

  describe('ComponentSelectionResult interface', () => {
    it('should accept valid component selection result', () => {
      const result: ComponentSelectionResult = {
        matches: [
          {
            componentId: 'hero-default',
            componentType: 'hero',
            confidence: 0.9,
            reasoning: 'Hero content detected',
            contentMapping: { title: 'Welcome' }
          }
        ],
        metadata: {
          totalComponents: 1,
          processingTime: 150
        }
      };

      expect(result.matches.length).toBe(1);
      expect(result.matches[0].componentId).toBe('hero-default');
      expect(result.metadata?.totalComponents).toBe(1);
    });

    it('should accept result with multiple matches', () => {
      const result: ComponentSelectionResult = {
        matches: [
          {
            componentId: 'hero-default',
            componentType: 'hero',
            confidence: 0.9,
            reasoning: 'Hero detected',
            contentMapping: {}
          },
          {
            componentId: 'features-grid',
            componentType: 'features',
            confidence: 0.8,
            reasoning: 'Features detected',
            contentMapping: {}
          }
        ]
      };

      expect(result.matches.length).toBe(2);
      expect(result.matches[0].confidence).toBeGreaterThan(result.matches[1].confidence);
    });

    it('should accept result without metadata', () => {
      const result: ComponentSelectionResult = {
        matches: []
      };

      expect(result.matches).toEqual([]);
      expect(result.metadata).toBeUndefined();
    });
  });

  describe('SemanticContent interface', () => {
    it('should accept hero content', () => {
      const content: SemanticContent = {
        hero: {
          title: 'Welcome to Our Site',
          subtitle: 'Hello World',
          description: 'This is our amazing website',
          primaryButton: { text: 'Get Started', url: '/start' },
          secondaryButton: { text: 'Learn More', url: '/about' },
          backgroundImage: '/hero-bg.jpg'
        }
      };

      expect(content.hero?.title).toBe('Welcome to Our Site');
      expect(content.hero?.primaryButton?.text).toBe('Get Started');
      expect(content.hero?.backgroundImage).toBe('/hero-bg.jpg');
    });

    it('should accept features content', () => {
      const content: SemanticContent = {
        features: {
          title: 'Our Features',
          subtitle: 'What we offer',
          features: [
            {
              title: 'Fast',
              description: 'Lightning fast performance',
              icon: 'zap'
            },
            {
              title: 'Secure',
              description: 'Enterprise security',
              image: '/security.jpg'
            }
          ]
        }
      };

      expect(content.features?.title).toBe('Our Features');
      expect(content.features?.features.length).toBe(2);
      expect(content.features?.features[0].icon).toBe('zap');
      expect(content.features?.features[1].image).toBe('/security.jpg');
    });

    it('should accept pricing content', () => {
      const content: SemanticContent = {
        pricing: {
          title: 'Choose Your Plan',
          subtitle: 'Find the perfect plan for you',
          plans: [
            {
              name: 'Basic',
              price: '$9',
              period: 'month',
              description: 'Perfect for starters',
              features: ['1 website', 'Basic support'],
              button: { text: 'Start Free', highlighted: false },
              popular: false
            },
            {
              name: 'Pro',
              price: '$29',
              period: 'month',
              features: ['10 websites', 'Priority support', 'Advanced analytics'],
              button: { text: 'Go Pro', highlighted: true },
              popular: true
            }
          ]
        }
      };

      expect(content.pricing?.plans.length).toBe(2);
      expect(content.pricing?.plans[0].name).toBe('Basic');
      expect(content.pricing?.plans[1].popular).toBe(true);
      expect(content.pricing?.plans[1].button?.highlighted).toBe(true);
    });

    it('should accept testimonials content', () => {
      const content: SemanticContent = {
        testimonials: {
          title: 'What Our Customers Say',
          subtitle: 'Real feedback from real users',
          testimonials: [
            {
              name: 'John Doe',
              role: 'CEO',
              company: 'Tech Corp',
              content: 'Amazing service!',
              avatar: '/john.jpg',
              rating: 5
            }
          ]
        }
      };

      expect(content.testimonials?.testimonials.length).toBe(1);
      expect(content.testimonials?.testimonials[0].name).toBe('John Doe');
      expect(content.testimonials?.testimonials[0].rating).toBe(5);
    });

    it('should accept partial content', () => {
      const content: SemanticContent = {
        hero: { title: 'Welcome' },
        // No other content types
      };

      expect(content.hero?.title).toBe('Welcome');
      expect(content.features).toBeUndefined();
      expect(content.pricing).toBeUndefined();
      expect(content.testimonials).toBeUndefined();
    });
  });

  describe('ComponentRegistryInfo interface', () => {
    it('should accept valid component registry info', () => {
      const registry: ComponentRegistryInfo = {
        availableComponents: [
          {
            id: 'hero-default',
            type: 'hero',
            name: 'Hero Section',
            description: 'Main hero section with title and CTA',
            schema: {
              title: { type: 'string' },
              description: { type: 'string' }
            }
          },
          {
            id: 'features-grid',
            type: 'features',
            name: 'Features Grid',
            description: 'Grid layout for features',
            schema: {
              features: { type: 'array' }
            }
          }
        ]
      };

      expect(registry.availableComponents.length).toBe(2);
      expect(registry.availableComponents[0].id).toBe('hero-default');
      expect(registry.availableComponents[1].type).toBe('features');
    });

    it('should accept empty registry', () => {
      const registry: ComponentRegistryInfo = {
        availableComponents: []
      };

      expect(registry.availableComponents).toEqual([]);
    });
  });

  describe('ComponentSelectionRequest interface', () => {
    it('should accept valid component selection request', () => {
      const request: ComponentSelectionRequest = {
        semanticContent: {
          hero: { title: 'Welcome' },
          features: { features: [] }
        },
        componentRegistry: {
          availableComponents: [
            { id: 'hero-default', type: 'hero', name: 'Hero', description: 'Hero component', schema: {} }
          ]
        },
        context: {
          pageSummary: {
            url: 'https://example.com',
            title: 'Example Page',
            metaDescription: 'Example description'
          },
          themeTokens: {
            colors: ['#000', '#fff'],
            fonts: ['Arial'],
            spacingScale: [4, 8, 16]
          }
        }
      };

      expect(request.semanticContent.hero?.title).toBe('Welcome');
      expect(request.componentRegistry.availableComponents.length).toBe(1);
      expect(request.context?.pageSummary?.title).toBe('Example Page');
      expect(request.context?.themeTokens?.colors).toContain('#000');
    });

    it('should accept request without context', () => {
      const request: ComponentSelectionRequest = {
        semanticContent: { hero: { title: 'Test' } },
        componentRegistry: { availableComponents: [] }
      };

      expect(request.semanticContent.hero?.title).toBe('Test');
      expect(request.context).toBeUndefined();
    });
  });

  describe('PipelinePhase type', () => {
    it('should accept all pipeline phase values', () => {
      const phases: PipelinePhase[] = [
        'extraction',
        'analysis',
        'selection',
        'generation',
        'finalization'
      ];

      phases.forEach(phase => {
        expect(PIPELINE_PHASES).toContain(phase);
      });
    });

    it('should match PIPELINE_PHASES values', () => {
      const phase: PipelinePhase = 'extraction';
      expect(PIPELINE_PHASES).toContain(phase);
    });
  });

  describe('PipelineProgress interface', () => {
    it('should accept valid pipeline progress', () => {
      const progress: PipelineProgress = {
        projectId: 'test-project-123',
        phase: 'extraction',
        progress: 75,
        currentStep: 'Crawling page 3 of 5',
        errors: []
      };

      expect(progress.projectId).toBe('test-project-123');
      expect(progress.phase).toBe('extraction');
      expect(progress.progress).toBe(75);
      expect(progress.currentStep).toBe('Crawling page 3 of 5');
      expect(progress.errors).toEqual([]);
    });

    it('should accept progress with errors', () => {
      const progress: PipelineProgress = {
        projectId: 'test-project-123',
        phase: 'analysis',
        progress: 50,
        errors: ['Failed to parse CSS', 'Timeout on image download']
      };

      expect(progress.errors.length).toBe(2);
      expect(progress.errors[0]).toContain('Failed to parse CSS');
    });

    it('should accept progress for all phases', () => {
      PIPELINE_PHASES.forEach(phase => {
        const progress: PipelineProgress = {
          projectId: 'test-project',
          phase,
          progress: 0,
          errors: []
        };

        expect(progress.phase).toBe(phase);
      });
    });
  });

  describe('AnalysisResult interface', () => {
    it('should accept valid analysis result', () => {
      const result: AnalysisResult = {
        designTokens: {
          colors: ['#000', '#fff', '#f00'],
          fonts: ['Arial', 'Helvetica'],
          spacingScale: [4, 8, 16, 24],
          borderRadius: [4, 8],
          shadows: ['0 1px 3px rgba(0,0,0,0.1)'],
          requiredComponents: ['button', 'card']
        },
        contentSlices: [
          {
            type: 'heading',
            content: 'Welcome to Our Site',
            metadata: { level: 1 }
          },
          {
            type: 'paragraph',
            content: 'This is our amazing website',
            metadata: {}
          }
        ],
        semanticContent: {
          hero: {
            title: 'Welcome to Our Site',
            description: 'This is our amazing website',
            primaryButton: { text: 'Get Started' }
          }
        },
        colorPalette: {
          primary: ['#000', '#333', '#666'],
          secondary: ['#fff', '#f5f5f5'],
          accent: ['#f00', '#c00']
        }
      };

      expect(result.designTokens.colors.length).toBeGreaterThan(0);
      expect(result.contentSlices.length).toBe(2);
      expect(result.semanticContent.hero?.title).toBe('Welcome to Our Site');
      expect(result.colorPalette?.primary).toBeDefined();
    });

    it('should accept minimal analysis result', () => {
      const result: AnalysisResult = {
        designTokens: {
          colors: [],
          fonts: [],
          spacingScale: []
        },
        contentSlices: [],
        semanticContent: {}
      };

      expect(result.designTokens).toBeDefined();
      expect(result.contentSlices).toEqual([]);
      expect(result.semanticContent).toEqual({});
    });
  });

  describe('New type exports', () => {
    it('should export all new component-based types', () => {
      // Type checking test - if this compiles, types are exported correctly
      const match: ComponentMatch = {
        componentId: 'test',
        componentType: 'hero',
        confidence: 0.8,
        reasoning: 'Test',
        contentMapping: {}
      };

      const selectionResult: ComponentSelectionResult = {
        matches: [match]
      };

      const semanticContent: SemanticContent = {
        hero: { title: 'Test' }
      };

      const registry: ComponentRegistryInfo = {
        availableComponents: []
      };

      const request: ComponentSelectionRequest = {
        semanticContent,
        componentRegistry: registry
      };

      const phase: PipelinePhase = 'extraction';

      const pipelineProgress: PipelineProgress = {
        projectId: 'test',
        phase: 'extraction',
        progress: 50
      };

      const analysisResult: AnalysisResult = {
        designTokens: { colors: [], fonts: [], spacingScale: [] },
        contentSlices: [],
        semanticContent: {}
      };

      expect(match).toBeDefined();
      expect(selectionResult).toBeDefined();
      expect(semanticContent).toBeDefined();
      expect(registry).toBeDefined();
      expect(request).toBeDefined();
      expect(phase).toBeDefined();
      expect(pipelineProgress).toBeDefined();
      expect(analysisResult).toBeDefined();
    });
  });
});

