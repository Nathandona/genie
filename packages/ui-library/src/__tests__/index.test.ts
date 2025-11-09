import { describe, it, expect } from 'vitest';
import {
  COMPONENT_TYPES,
  HeroContentSchema,
  FeaturesContentSchema,
  PricingContentSchema,
  componentRegistry,
  validateComponentContent,
  renderComponent,
  getComponentsByType
} from '../index.js';

describe('@genie/ui-library', () => {
  describe('Component Types', () => {
    it('should export all component types', () => {
      expect(COMPONENT_TYPES).toBeDefined();
      expect(Array.isArray(COMPONENT_TYPES)).toBe(true);
      expect(COMPONENT_TYPES.length).toBeGreaterThan(0);
    });

    it('should include core component types', () => {
      expect(COMPONENT_TYPES).toContain('hero');
      expect(COMPONENT_TYPES).toContain('features');
      expect(COMPONENT_TYPES).toContain('pricing');
    });
  });

  describe('Content Schemas', () => {
    it('should validate hero content schema', () => {
      const validHero = {
        title: 'Welcome',
        subtitle: 'Hello world',
        description: 'This is a test',
        primaryButton: { text: 'Click me' }
      };

      const result = HeroContentSchema.safeParse(validHero);
      expect(result.success).toBe(true);
    });

    it('should reject invalid hero content', () => {
      const invalidHero = { subtitle: 'Missing title' };
      const result = HeroContentSchema.safeParse(invalidHero);
      expect(result.success).toBe(false);
    });

    it('should validate features content schema', () => {
      const validFeatures = {
        title: 'Features',
        features: [
          { title: 'Feature 1', description: 'Description 1' },
          { title: 'Feature 2', description: 'Description 2' }
        ]
      };

      const result = FeaturesContentSchema.safeParse(validFeatures);
      expect(result.success).toBe(true);
    });

    it('should validate pricing content schema', () => {
      const validPricing = {
        title: 'Pricing',
        plans: [
          {
            name: 'Basic',
            price: '$10',
            features: ['Feature 1', 'Feature 2'],
            button: { text: 'Buy Now' }
          }
        ]
      };

      const result = PricingContentSchema.safeParse(validPricing);
      expect(result.success).toBe(true);
    });
  });

  describe('Component Registry', () => {
    it('should have registered components', () => {
      const allComponents = componentRegistry.getAll();
      expect(allComponents.length).toBeGreaterThan(0);
    });

    it('should have hero components registered', () => {
      const heroComponents = componentRegistry.getByType('hero');
      expect(heroComponents.length).toBeGreaterThan(0);
    });

    it('should have features components registered', () => {
      const featuresComponents = componentRegistry.getByType('features');
      expect(featuresComponents.length).toBeGreaterThan(0);
    });

    it('should have pricing components registered', () => {
      const pricingComponents = componentRegistry.getByType('pricing');
      expect(pricingComponents.length).toBeGreaterThan(0);
    });

    it('should have testimonials components registered', () => {
      const testimonialsComponents = componentRegistry.getByType('testimonials');
      expect(testimonialsComponents.length).toBeGreaterThan(0);
    });

    it('should have footer components registered', () => {
      const footerComponents = componentRegistry.getByType('footer');
      expect(footerComponents.length).toBeGreaterThan(0);
    });

    it('should have navigation components registered', () => {
      const navigationComponents = componentRegistry.getByType('navigation');
      expect(navigationComponents.length).toBeGreaterThan(0);
    });

    it('should have contact components registered', () => {
      const contactComponents = componentRegistry.getByType('contact');
      expect(contactComponents.length).toBeGreaterThan(0);
    });

    it('should have about components registered', () => {
      const aboutComponents = componentRegistry.getByType('about');
      expect(aboutComponents.length).toBeGreaterThan(0);
    });

    it('should have stats components registered', () => {
      const statsComponents = componentRegistry.getByType('stats');
      expect(statsComponents.length).toBeGreaterThan(0);
    });
  });

  describe('Content Validation', () => {
    it('should validate valid hero content', () => {
      const content = {
        title: 'Test Hero',
        description: 'A test hero section'
      };

      const result = validateComponentContent('hero', content);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should reject invalid hero content', () => {
      const content = { description: 'Missing required title' };
      const result = validateComponentContent('hero', content);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('Component Rendering', () => {
    it('should render hero component', () => {
      const content = {
        title: 'Welcome',
        description: 'Welcome to our platform'
      };

      const html = renderComponent('hero-default', content);
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('Welcome');
    });

    it('should render features component', () => {
      const content = {
        features: [
          { title: 'Feature 1', description: 'Description 1' },
          { title: 'Feature 2', description: 'Description 2' }
        ]
      };

      const html = renderComponent('features-grid', content);
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('Feature 1');
      expect(html).toContain('Feature 2');
    });

    it('should render pricing component', () => {
      const content = {
        plans: [
          {
            name: 'Basic',
            price: '$10',
            features: ['Feature 1'],
            button: { text: 'Buy Now' }
          }
        ]
      };

      const html = renderComponent('pricing-cards', content);
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('Basic');
      expect(html).toContain('$10');
    });

    it('should render testimonials component', () => {
      const content = {
        testimonials: [
          {
            name: 'John Doe',
            content: 'Great service!',
            rating: 5
          }
        ]
      };

      const html = renderComponent('testimonials-grid', content);
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('John Doe');
      expect(html).toContain('Great service!');
    });

    it('should render footer component', () => {
      const content = {
        copyright: '© 2024 Test Company'
      };

      const html = renderComponent('footer-multi-column', content);
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('© 2024 Test Company');
    });
  });

  describe('Component Queries', () => {
    it('should return components by type', () => {
      const heroComponents = getComponentsByType('hero');
      expect(Array.isArray(heroComponents)).toBe(true);
      expect(heroComponents.length).toBeGreaterThan(0);
      expect(heroComponents[0].metadata.type).toBe('hero');
    });
  });
});
