import { StatsContent } from '../types/component-interfaces.js';

/**
 * Stats component factory
 */
export function createStatsComponent(content: StatsContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'grid', className = '' } = options || {};
  const { title, subtitle, stats } = content;

  const statsItems = stats.map(stat => `
    <div class="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div class="text-4xl lg:text-5xl font-bold text-primary mb-2">${stat.value}</div>
      <div class="text-muted-foreground font-medium">${stat.label}</div>
      ${stat.description ? `<div class="text-sm text-muted-foreground mt-2">${stat.description}</div>` : ''}
    </div>
  `).join('');

  const gridCols = stats.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
                   stats.length <= 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
                   'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return `
<section class="py-20 lg:py-32 ${className}">
  <div class="container mx-auto px-4">
    ${title || subtitle ? `
    <div class="text-center mb-16">
      ${title ? `<h2 class="text-3xl lg:text-4xl font-bold mb-4">${title}</h2>` : ''}
      ${subtitle ? `<p class="text-xl text-muted-foreground max-w-2xl mx-auto">${subtitle}</p>` : ''}
    </div>
    ` : ''}
    <div class="grid ${gridCols} gap-8 max-w-4xl mx-auto">
      ${statsItems}
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Stats variants
 */
export const statsVariants = {
  grid: (content: StatsContent) => createStatsComponent(content, { variant: 'grid' }),
  compact: (content: StatsContent) => createStatsComponent(content, { variant: 'compact' }),
  large: (content: StatsContent) => createStatsComponent(content, { variant: 'large' })
};
