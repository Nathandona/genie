import { AboutContent } from '../types/component-interfaces.js';

/**
 * About component factory
 */
export function createAboutComponent(content: AboutContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'split', className = '' } = options || {};
  const {
    title,
    subtitle,
    description,
    image,
    features,
    stats,
    cta
  } = content;

  const featuresHtml = features?.length ? `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      ${features.map(feature => `
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <svg class="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div>
            <h3 class="font-semibold mb-1">${feature.title}</h3>
            <p class="text-muted-foreground text-sm">${feature.description}</p>
          </div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const statsHtml = stats?.length ? `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      ${stats.map(stat => `
        <div class="text-center">
          <div class="text-3xl font-bold text-primary mb-2">${stat.value}</div>
          <div class="text-muted-foreground">${stat.label}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const ctaButton = cta ? `
    <div class="mt-8">
      <a href="${cta.url}" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        ${cta.text}
      </a>
    </div>
  ` : '';

  return `
<section class="py-20 lg:py-32 ${className}">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
      <div class="order-2 lg:order-1">
        ${title ? `<h2 class="text-3xl lg:text-4xl font-bold mb-4">${title}</h2>` : ''}
        ${subtitle ? `<p class="text-lg text-muted-foreground mb-6">${subtitle}</p>` : ''}
        ${description ? `<p class="text-muted-foreground mb-8">${description}</p>` : ''}
        ${featuresHtml}
        ${statsHtml}
        ${ctaButton}
      </div>
      <div class="order-1 lg:order-2">
        ${image ? `<img src="${image}" alt="${title || 'About'}" class="rounded-lg shadow-lg w-full h-auto" />` : ''}
      </div>
    </div>
  </div>
</section>
  `.trim();
}

/**
 * About variants
 */
export const aboutVariants = {
  split: (content: AboutContent) => createAboutComponent(content, { variant: 'split' }),
  centered: (content: AboutContent) => createAboutComponent(content, { variant: 'centered' }),
  minimal: (content: AboutContent) => createAboutComponent(content, { variant: 'minimal' })
};
