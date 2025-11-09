import { z } from 'zod';

/**
 * Base component interface that all UI components must implement
 */
export interface BaseComponent {
  id: string;
  type: ComponentType;
  content: Record<string, unknown>;
  metadata?: {
    confidence?: number;
    source?: string;
  };
}

/**
 * Supported component types
 */
export const COMPONENT_TYPES = [
  'hero',
  'features',
  'pricing',
  'testimonials',
  'contact',
  'footer',
  'navigation',
  'about',
  'stats',
  'cta'
] as const;

export type ComponentType = (typeof COMPONENT_TYPES)[number];

/**
 * Hero component content schema
 */
export const HeroContentSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  primaryButton: z.object({
    text: z.string(),
    url: z.string().optional()
  }).optional(),
  secondaryButton: z.object({
    text: z.string(),
    url: z.string().optional()
  }).optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional()
});

export type HeroContent = z.infer<typeof HeroContentSchema>;

/**
 * Features component content schema
 */
export const FeaturesContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string().optional(),
    image: z.string().optional()
  })).min(1)
});

export type FeaturesContent = z.infer<typeof FeaturesContentSchema>;

/**
 * Pricing component content schema
 */
export const PricingContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  plans: z.array(z.object({
    name: z.string(),
    price: z.string(),
    period: z.string().optional(),
    description: z.string().optional(),
    features: z.array(z.string()),
    button: z.object({
      text: z.string(),
      url: z.string().optional(),
      highlighted: z.boolean().optional()
    }),
    popular: z.boolean().optional()
  })).min(1)
});

export type PricingContent = z.infer<typeof PricingContentSchema>;

/**
 * Testimonials component content schema
 */
export const TestimonialsContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  testimonials: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    company: z.string().optional(),
    content: z.string(),
    avatar: z.string().optional(),
    rating: z.number().min(1).max(5).optional()
  })).min(1)
});

export type TestimonialsContent = z.infer<typeof TestimonialsContentSchema>;

/**
 * Contact component content schema
 */
export const ContactContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  form: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'email', 'tel', 'textarea']),
      label: z.string(),
      required: z.boolean().optional(),
      placeholder: z.string().optional()
    }))
  }).optional()
});

export type ContactContent = z.infer<typeof ContactContentSchema>;

/**
 * Footer component content schema
 */
export const FooterContentSchema = z.object({
  logo: z.string().optional(),
  description: z.string().optional(),
  links: z.array(z.object({
    title: z.string(),
    items: z.array(z.object({
      text: z.string(),
      url: z.string()
    }))
  })).optional(),
  social: z.array(z.object({
    platform: z.string(),
    url: z.string(),
    icon: z.string().optional()
  })).optional(),
  copyright: z.string().optional()
});

export type FooterContent = z.infer<typeof FooterContentSchema>;

/**
 * Navigation component content schema
 */
export const NavigationContentSchema = z.object({
  logo: z.string().optional(),
  links: z.array(z.object({
    text: z.string(),
    url: z.string(),
    children: z.array(z.object({
      text: z.string(),
      url: z.string()
    })).optional()
  })),
  cta: z.object({
    text: z.string(),
    url: z.string()
  }).optional()
});

export type NavigationContent = z.infer<typeof NavigationContentSchema>;

/**
 * About component content schema
 */
export const AboutContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string()
  })).optional(),
  stats: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
  cta: z.object({
    text: z.string(),
    url: z.string()
  }).optional()
});

export type AboutContent = z.infer<typeof AboutContentSchema>;

/**
 * Stats component content schema
 */
export const StatsContentSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  stats: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional()
  })).min(1)
});

export type StatsContent = z.infer<typeof StatsContentSchema>;

/**
 * Union type for all component contents
 */
export type ComponentContent =
  | HeroContent
  | FeaturesContent
  | PricingContent
  | TestimonialsContent
  | ContactContent
  | FooterContent
  | NavigationContent
  | AboutContent
  | StatsContent;

/**
 * Component schemas map
 */
export const COMPONENT_SCHEMAS = {
  hero: HeroContentSchema,
  features: FeaturesContentSchema,
  pricing: PricingContentSchema,
  testimonials: TestimonialsContentSchema,
  contact: ContactContentSchema,
  footer: FooterContentSchema,
  navigation: NavigationContentSchema,
  about: AboutContentSchema,
  stats: StatsContentSchema,
  cta: z.object({}) // Placeholder
} as const;
