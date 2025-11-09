import { PricingContent } from '../types/component-interfaces.js';

/**
 * Pricing component factory
 */
export function createPricingComponent(content: PricingContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'cards', className = '' } = options || {};
  const { title, subtitle, plans } = content;

  const planItems = plans.map(plan => {
    const features = plan.features.map(feature => `
      <li class="flex items-center">
        <svg class="w-4 h-4 text-primary mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        ${feature}
      </li>
    `).join('');

    const popularBadge = plan.popular ? `
      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <span class="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
      </div>
    ` : '';

    const buttonVariant = plan.button.highlighted ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
    const buttonClasses = `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 w-full ${buttonVariant}`;

    return `
    <div class="relative p-8 rounded-lg border bg-card ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : 'hover:shadow-lg'} transition-all">
      ${popularBadge}
      <div class="text-center">
        <h3 class="text-2xl font-bold mb-2">${plan.name}</h3>
        <div class="mb-4">
          <span class="text-4xl font-bold">${plan.price}</span>
          ${plan.period ? `<span class="text-muted-foreground">/${plan.period}</span>` : ''}
        </div>
        ${plan.description ? `<p class="text-muted-foreground mb-6">${plan.description}</p>` : ''}
        <ul class="text-left mb-8 space-y-2">
          ${features}
        </ul>
        <button class="${buttonClasses}">
          ${plan.button.text}
        </button>
      </div>
    </div>
    `;
  }).join('');

  return `
<section class="py-20 lg:py-32 ${className}">
  <div class="container mx-auto px-4">
    ${title || subtitle ? `
    <div class="text-center mb-16">
      ${title ? `<h2 class="text-3xl lg:text-4xl font-bold mb-4">${title}</h2>` : ''}
      ${subtitle ? `<p class="text-xl text-muted-foreground max-w-2xl mx-auto">${subtitle}</p>` : ''}
    </div>
    ` : ''}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(plans.length, 3)} gap-8 max-w-6xl mx-auto">
      ${planItems}
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Pricing variants
 */
export const pricingVariants = {
  cards: (content: PricingContent) => createPricingComponent(content, { variant: 'cards' }),
  table: (content: PricingContent) => createPricingComponent(content, { variant: 'table' }),
  comparison: (content: PricingContent) => createPricingComponent(content, { variant: 'comparison' })
};
