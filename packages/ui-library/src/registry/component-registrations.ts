import { componentRegistry } from './component-registry.js';
import { COMPONENT_SCHEMAS } from '../types/component-interfaces.js';
import { createHeroComponent, heroVariants } from '../components/hero.js';
import { createFeaturesComponent, featuresVariants } from '../components/features.js';
import { createPricingComponent, pricingVariants } from '../components/pricing.js';
import { createTestimonialsComponent, testimonialsVariants } from '../components/testimonials.js';
import { createFooterComponent, footerVariants } from '../components/footer.js';
import { createNavigationComponent, navigationVariants } from '../components/navigation.js';
import { createContactComponent, contactVariants } from '../components/contact.js';
import { createAboutComponent, aboutVariants } from '../components/about.js';
import { createStatsComponent, statsVariants } from '../components/stats.js';

/**
 * Register all built-in components
 */
export function registerBuiltInComponents(): void {
  // Register Hero component
  componentRegistry.register({
    id: 'hero-default',
    type: 'hero',
    name: 'Hero Section',
    description: 'Main hero section with title, subtitle, and call-to-action buttons',
    category: 'layout',
    schema: COMPONENT_SCHEMAS.hero,
    preview: {
      example: {
        title: 'Build something amazing',
        subtitle: 'Welcome to our platform',
        description: 'Create stunning websites with our AI-powered tools',
        primaryButton: { text: 'Get Started' },
        secondaryButton: { text: 'Learn More' }
      }
    },
    variants: ['default', 'centered', 'split', 'minimal']
  }, createHeroComponent);

  // Register Features components
  componentRegistry.register({
    id: 'features-grid',
    type: 'features',
    name: 'Features Grid',
    description: 'Grid layout showcasing product features',
    category: 'content',
    schema: COMPONENT_SCHEMAS.features,
    preview: {
      example: {
        title: 'Powerful Features',
        features: [
          {
            title: 'AI-Powered',
            description: 'Advanced AI algorithms for intelligent content generation'
          },
          {
            title: 'Fast & Reliable',
            description: 'Lightning-fast performance with 99.9% uptime guarantee'
          },
          {
            title: 'Easy to Use',
            description: 'Intuitive interface designed for everyone'
          }
        ]
      }
    },
    variants: ['grid', 'list', 'cards']
  }, createFeaturesComponent);

  // Register Pricing component
  componentRegistry.register({
    id: 'pricing-cards',
    type: 'pricing',
    name: 'Pricing Cards',
    description: 'Pricing plans displayed as cards',
    category: 'conversion',
    schema: COMPONENT_SCHEMAS.pricing,
    preview: {
      example: {
        title: 'Choose Your Plan',
        plans: [
          {
            name: 'Starter',
            price: '$9',
            period: 'month',
            features: ['1 website', 'Basic support', '5GB storage'],
            button: { text: 'Start Free Trial' }
          },
          {
            name: 'Pro',
            price: '$29',
            period: 'month',
            features: ['10 websites', 'Priority support', '50GB storage', 'Advanced analytics'],
            button: { text: 'Go Pro', highlighted: true },
            popular: true
          }
        ]
      }
    },
    variants: ['cards', 'table', 'comparison']
  }, createPricingComponent);

  // Register Testimonials component
  componentRegistry.register({
    id: 'testimonials-grid',
    type: 'testimonials',
    name: 'Testimonials Grid',
    description: 'Customer testimonials in a grid layout',
    category: 'social-proof',
    schema: COMPONENT_SCHEMAS.testimonials,
    preview: {
      example: {
        title: 'What Our Customers Say',
        testimonials: [
          {
            name: 'John Doe',
            role: 'CEO',
            company: 'Tech Corp',
            content: 'Amazing service and support!',
            rating: 5
          }
        ]
      }
    },
    variants: ['grid', 'carousel', 'single']
  }, createTestimonialsComponent);

  // Register Footer component
  componentRegistry.register({
    id: 'footer-multi-column',
    type: 'footer',
    name: 'Multi-Column Footer',
    description: 'Footer with multiple link columns and social media',
    category: 'navigation',
    schema: COMPONENT_SCHEMAS.footer,
    preview: {
      example: {
        description: 'Building the future of web development.',
        links: [
          {
            title: 'Product',
            items: [
              { text: 'Features', url: '/features' },
              { text: 'Pricing', url: '/pricing' }
            ]
          }
        ],
        social: [
          { platform: 'Twitter', url: 'https://twitter.com' }
        ],
        copyright: '© 2024 Company Name'
      }
    },
    variants: ['multi-column', 'simple', 'minimal']
  }, createFooterComponent);

  // Register Navigation component
  componentRegistry.register({
    id: 'navigation-horizontal',
    type: 'navigation',
    name: 'Horizontal Navigation',
    description: 'Responsive navigation bar with dropdown menus',
    category: 'navigation',
    schema: COMPONENT_SCHEMAS.navigation,
    preview: {
      example: {
        links: [
          { text: 'Home', url: '/' },
          { text: 'About', url: '/about' },
          { text: 'Services', url: '/services', children: [
            { text: 'Web Design', url: '/services/web-design' }
          ]}
        ],
        cta: { text: 'Get Started', url: '/contact' }
      }
    },
    variants: ['horizontal', 'vertical', 'centered']
  }, createNavigationComponent);

  // Register Contact component
  componentRegistry.register({
    id: 'contact-form-left',
    type: 'contact',
    name: 'Contact Form & Info',
    description: 'Contact form alongside company information',
    category: 'conversion',
    schema: COMPONENT_SCHEMAS.contact,
    preview: {
      example: {
        title: 'Get In Touch',
        description: 'We\'d love to hear from you.',
        email: 'hello@company.com',
        phone: '+1 (555) 123-4567',
        form: {
          fields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'email', type: 'email', label: 'Email', required: true },
            { name: 'message', type: 'textarea', label: 'Message', required: true }
          ]
        }
      }
    },
    variants: ['form-left', 'form-right', 'centered']
  }, createContactComponent);

  // Register About component
  componentRegistry.register({
    id: 'about-split',
    type: 'about',
    name: 'About Section',
    description: 'About section with image and content',
    category: 'content',
    schema: COMPONENT_SCHEMAS.about,
    preview: {
      example: {
        title: 'About Our Company',
        description: 'We are a team of passionate developers...',
        features: [
          { title: 'Innovation', description: 'Cutting-edge solutions' }
        ],
        cta: { text: 'Learn More', url: '/about' }
      }
    },
    variants: ['split', 'centered', 'minimal']
  }, createAboutComponent);

  // Register Stats component
  componentRegistry.register({
    id: 'stats-grid',
    type: 'stats',
    name: 'Statistics Grid',
    description: 'Display key statistics and metrics',
    category: 'content',
    schema: COMPONENT_SCHEMAS.stats,
    preview: {
      example: {
        title: 'Our Impact',
        stats: [
          { value: '10K+', label: 'Happy Customers' },
          { value: '99%', label: 'Uptime' },
          { value: '24/7', label: 'Support' }
        ]
      }
    },
    variants: ['grid', 'compact', 'large']
  }, createStatsComponent);
}

/**
 * Initialize the component registry with built-in components
 */
export function initializeComponentRegistry(): void {
  registerBuiltInComponents();
}
