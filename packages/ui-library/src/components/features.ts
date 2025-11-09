import { FeaturesContent } from '../types/component-interfaces.js';

/**
 * Features component factory
 */
export function createFeaturesComponent(content: FeaturesContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'grid', className = '' } = options || {};
  const { title, subtitle, features } = content;

  const featureItems = features.map(feature => `
    <div class="flex flex-col items-center text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      ${feature.icon ? `<div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">${feature.icon}</div>` : ''}
      <h3 class="text-xl font-semibold mb-2">${feature.title}</h3>
      <p class="text-muted-foreground">${feature.description}</p>
      ${feature.image ? `<img src="${feature.image}" alt="${feature.title}" class="mt-4 rounded-lg w-full h-48 object-cover" />` : ''}
    </div>
  `).join('');

  const gridCols = features.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
                   features.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                   'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return `
<section class="py-20 lg:py-32 ${className}">
  <div class="container mx-auto px-4">
    ${title || subtitle ? `
    <div class="text-center mb-16">
      ${title ? `<h2 class="text-3xl lg:text-4xl font-bold mb-4">${title}</h2>` : ''}
      ${subtitle ? `<p class="text-xl text-muted-foreground max-w-2xl mx-auto">${subtitle}</p>` : ''}
    </div>
    ` : ''}
    <div class="grid ${gridCols} gap-8">
      ${featureItems}
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Features variants
 */
export const featuresVariants = {
  grid: (content: FeaturesContent) => createFeaturesComponent(content, { variant: 'grid' }),
  list: (content: FeaturesContent) => createFeaturesComponent(content, { variant: 'list' }),
  cards: (content: FeaturesContent) => createFeaturesComponent(content, { variant: 'cards' })
};
