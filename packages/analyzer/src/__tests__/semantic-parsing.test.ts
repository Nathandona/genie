import { describe, it, expect } from 'vitest';
import {
  findHeroSections,
  heroCandidateToContent
} from '../semantic-parsers/hero-parser.js';
import {
  findFeaturesSections,
  featuresCandidateToContent
} from '../semantic-parsers/features-parser.js';
import {
  findPricingSections,
  pricingCandidateToContent
} from '../semantic-parsers/pricing-parser.js';
import {
  findTestimonialsSections,
  testimonialsCandidateToContent
} from '../semantic-parsers/testimonials-parser.js';
import { extractSemanticContent } from '../core/analyzer.js';

describe('Semantic Content Parsing', () => {
  describe('Hero Parser', () => {
    it('should find hero sections in HTML', () => {
      const html = `
        <section class="hero">
          <h1>Welcome to Our Platform</h1>
          <p>Build amazing websites with AI</p>
          <a href="/signup" class="btn">Get Started</a>
          <a href="/learn" class="btn secondary">Learn More</a>
        </section>
      `;

      const heroes = findHeroSections(html);
      expect(heroes.length).toBeGreaterThan(0);
      expect(heroes[0].title).toContain('Welcome');
      expect(heroes[0].confidence).toBeGreaterThan(0);
    });

    it('should convert hero candidate to content', () => {
      const candidate = {
        title: 'Welcome',
        subtitle: 'Hello',
        description: 'Build websites',
        primaryButton: { text: 'Start', url: '/start' },
        secondaryButton: { text: 'Learn', url: '/learn' },
        confidence: 0.8
      };

      const content = heroCandidateToContent(candidate);
      expect(content.title).toBe('Welcome');
      expect(content.subtitle).toBe('Hello');
      expect(content.primaryButton?.text).toBe('Start');
      expect(content.secondaryButton?.text).toBe('Learn');
    });

    it('should handle missing hero elements gracefully', () => {
      const html = '<div>No hero here</div>';
      const heroes = findHeroSections(html);
      expect(heroes.length).toBe(0);
    });
  });

  describe('Features Parser', () => {
    it('should find features sections in HTML', () => {
      const html = `
        <section class="features">
          <h2>Powerful Features</h2>
          <div class="feature">
            <h3>AI-Powered</h3>
            <p>Advanced AI algorithms</p>
          </div>
          <div class="feature">
            <h3>Fast</h3>
            <p>Lightning fast performance</p>
          </div>
        </section>
      `;

      const featuresSections = findFeaturesSections(html);
      expect(featuresSections.length).toBeGreaterThan(0);
      expect(featuresSections[0].title).toContain('Powerful Features');
      expect(featuresSections[0].features.length).toBeGreaterThan(0);
    });

    it('should convert features candidate to content', () => {
      const candidate = {
        title: 'Features',
        features: [
          { title: 'Feature 1', description: 'Description 1', confidence: 0.8 },
          { title: 'Feature 2', description: 'Description 2', confidence: 0.7 }
        ],
        confidence: 0.9
      };

      const content = featuresCandidateToContent(candidate);
      expect(content.title).toBe('Features');
      expect(content.features).toHaveLength(2);
      expect(content.features[0].title).toBe('Feature 1');
    });
  });

  describe('Pricing Parser', () => {
    it('should find pricing sections in HTML', () => {
      const html = `
        <section class="pricing">
          <h2>Choose Your Plan</h2>
          <div class="plan">
            <h3>Starter</h3>
            <div class="price">$9/month</div>
            <ul>
              <li>1 website</li>
              <li>Basic support</li>
            </ul>
            <a href="/signup" class="btn">Get Started</a>
          </div>
          <div class="plan popular">
            <h3>Pro</h3>
            <div class="price">$29/month</div>
            <ul>
              <li>10 websites</li>
              <li>Priority support</li>
            </ul>
            <a href="/signup" class="btn">Go Pro</a>
          </div>
        </section>
      `;

      const pricingSections = findPricingSections(html);
      expect(pricingSections.length).toBeGreaterThan(0);
      expect(pricingSections[0].plans.length).toBeGreaterThan(0);
      expect(pricingSections[0].plans[0].name).toContain('Starter');
    });

    it('should convert pricing candidate to content', () => {
      const candidate = {
        title: 'Pricing',
        plans: [
          {
            name: 'Basic',
            price: '$10',
            period: 'month',
            features: ['Feature 1', 'Feature 2'],
            button: { text: 'Buy Now' },
            popular: false,
            confidence: 0.8
          }
        ],
        confidence: 0.9
      };

      const content = pricingCandidateToContent(candidate);
      expect(content.title).toBe('Pricing');
      expect(content.plans).toHaveLength(1);
      expect(content.plans[0].name).toBe('Basic');
      expect(content.plans[0].price).toBe('$10');
    });
  });

  describe('Testimonials Parser', () => {
    it('should find testimonials sections in HTML', () => {
      const html = `
        <section class="testimonials">
          <h2>What Our Customers Say</h2>
          <div class="testimonial">
            <blockquote>"Amazing service!"</blockquote>
            <cite>John Doe, CEO, Tech Corp</cite>
          </div>
          <div class="testimonial">
            <blockquote>"Highly recommend"</blockquote>
            <cite>Jane Smith, Designer</cite>
          </div>
        </section>
      `;

      const testimonialsSections = findTestimonialsSections(html);
      expect(testimonialsSections.length).toBeGreaterThan(0);
      expect(testimonialsSections[0].testimonials.length).toBeGreaterThan(0);
      expect(testimonialsSections[0].testimonials[0].content).toContain('Amazing service');
    });

    it('should convert testimonials candidate to content', () => {
      const candidate = {
        title: 'Testimonials',
        testimonials: [
          {
            name: 'John Doe',
            role: 'CEO',
            company: 'Tech Corp',
            content: 'Amazing service!',
            confidence: 0.8
          }
        ],
        confidence: 0.9
      };

      const content = testimonialsCandidateToContent(candidate);
      expect(content.title).toBe('Testimonials');
      expect(content.testimonials).toHaveLength(1);
      expect(content.testimonials[0].name).toBe('John Doe');
      expect(content.testimonials[0].content).toBe('Amazing service!');
    });
  });

  describe('Semantic Content Extraction', () => {
    it('should extract semantic content from HTML', () => {
      const html = `
        <section class="hero">
          <h1>Welcome to Our Platform</h1>
          <p>Build amazing websites</p>
          <a href="/signup">Get Started</a>
        </section>
        <section class="features">
          <h2>Features</h2>
          <div class="feature">
            <h3>AI-Powered</h3>
            <p>Advanced AI</p>
          </div>
        </section>
      `;

      const semanticContent = extractSemanticContent(html);

      expect(semanticContent.hero).toBeDefined();
      expect(semanticContent.hero?.title).toContain('Welcome');
      expect(semanticContent.features).toBeDefined();
      expect(semanticContent.features?.title).toBe('Features');
    });

    it('should handle empty HTML gracefully', () => {
      const semanticContent = extractSemanticContent('<div></div>');
      expect(semanticContent).toEqual({});
    });

    it('should handle malformed HTML gracefully', () => {
      const semanticContent = extractSemanticContent('<unclosed><div>');
      expect(semanticContent).toEqual({});
    });
  });
});
