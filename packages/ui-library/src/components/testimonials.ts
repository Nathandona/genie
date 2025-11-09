import { TestimonialsContent } from '../types/component-interfaces.js';

/**
 * Testimonials component factory
 */
export function createTestimonialsComponent(content: TestimonialsContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'grid', className = '' } = options || {};
  const { title, subtitle, testimonials } = content;

  const testimonialItems = testimonials.map(testimonial => {
    const stars = testimonial.rating ? `
      <div class="flex items-center mb-2">
        ${Array.from({ length: 5 }, (_, i) => `
          <svg class="w-4 h-4 ${i < testimonial.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        `).join('')}
      </div>
    ` : '';

    return `
    <div class="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
      ${testimonial.avatar ? `<img src="${testimonial.avatar}" alt="${testimonial.name}" class="w-16 h-16 rounded-full mb-4 object-cover" />` : ''}
      ${stars}
      <blockquote class="text-muted-foreground mb-4 italic">"${testimonial.content}"</blockquote>
      <div class="text-center">
        <div class="font-semibold">${testimonial.name}</div>
        ${testimonial.role ? `<div class="text-sm text-muted-foreground">${testimonial.role}</div>` : ''}
        ${testimonial.company ? `<div class="text-sm text-muted-foreground">${testimonial.company}</div>` : ''}
      </div>
    </div>
    `;
  }).join('');

  const gridCols = testimonials.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
                   testimonials.length <= 3 ? 'grid-cols-1 md:grid-cols-3' :
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
      ${testimonialItems}
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Testimonials variants
 */
export const testimonialsVariants = {
  grid: (content: TestimonialsContent) => createTestimonialsComponent(content, { variant: 'grid' }),
  carousel: (content: TestimonialsContent) => createTestimonialsComponent(content, { variant: 'carousel' }),
  single: (content: TestimonialsContent) => createTestimonialsComponent(content, { variant: 'single' })
};
