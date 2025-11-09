import { HeroContent } from '../types/component-interfaces.js';

/**
 * Hero component factory
 */
export function createHeroComponent(content: HeroContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'default', className = '' } = options || {};

  const {
    title,
    subtitle,
    description,
    primaryButton,
    secondaryButton,
    backgroundImage,
    backgroundVideo
  } = content;

  let backgroundStyle = '';
  if (backgroundImage) {
    backgroundStyle = `style="background-image: url('${backgroundImage}'); background-size: cover; background-position: center;"`;
  }

  const primaryButtonHtml = primaryButton ? `
    <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 mr-4">
      ${primaryButton.text}
    </button>
  ` : '';

  const secondaryButtonHtml = secondaryButton ? `
    <button class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8">
      ${secondaryButton.text}
    </button>
  ` : '';

  return `
<section class="relative py-20 lg:py-32 ${backgroundImage ? 'bg-cover bg-center' : 'bg-gradient-to-br from-primary/5 to-secondary/5'} ${className}" ${backgroundStyle}>
  <div class="container mx-auto px-4 text-center">
    ${subtitle ? `<p class="text-lg text-muted-foreground mb-4">${subtitle}</p>` : ''}
    <h1 class="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
      ${title}
    </h1>
    ${description ? `<p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">${description}</p>` : ''}
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      ${primaryButtonHtml}
      ${secondaryButtonHtml}
    </div>
  </div>
  ${backgroundVideo ? `<video autoplay muted loop class="absolute inset-0 w-full h-full object-cover z-0" src="${backgroundVideo}"></video>` : ''}
</section>
  `.trim();
}

/**
 * Hero variants
 */
export const heroVariants = {
  centered: (content: HeroContent) => createHeroComponent(content, { variant: 'centered' }),
  split: (content: HeroContent) => createHeroComponent(content, { variant: 'split' }),
  minimal: (content: HeroContent) => createHeroComponent(content, { variant: 'minimal' })
};
