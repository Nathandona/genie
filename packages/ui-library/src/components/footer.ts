import { FooterContent } from '../types/component-interfaces.js';

/**
 * Footer component factory
 */
export function createFooterComponent(content: FooterContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'multi-column', className = '' } = options || {};
  const { logo, description, links, social, copyright } = content;

  const linksHtml = links?.map(linkGroup => `
    <div class="space-y-4">
      <h3 class="font-semibold text-foreground">${linkGroup.title}</h3>
      <ul class="space-y-2">
        ${linkGroup.items.map(item => `
          <li>
            <a href="${item.url}" class="text-muted-foreground hover:text-foreground transition-colors">
              ${item.text}
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('') || '';

  const socialHtml = social?.length ? `
    <div class="flex space-x-4">
      ${social.map(platform => `
        <a href="${platform.url}" class="text-muted-foreground hover:text-foreground transition-colors" aria-label="${platform.platform}">
          ${platform.icon ? platform.icon : `<span class="text-sm">${platform.platform}</span>`}
        </a>
      `).join('')}
    </div>
  ` : '';

  return `
<footer class="bg-muted/50 border-t py-12 lg:py-16 ${className}">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
      <div class="space-y-4">
        ${logo ? `<img src="${logo}" alt="Logo" class="h-8 w-auto mb-4" />` : ''}
        ${description ? `<p class="text-muted-foreground">${description}</p>` : ''}
        ${socialHtml}
      </div>
      ${linksHtml}
    </div>
    <div class="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
      <div class="text-muted-foreground text-sm mb-4 md:mb-0">
        ${copyright || `© ${new Date().getFullYear()} All rights reserved.`}
      </div>
      <div class="flex space-x-6 text-sm">
        <a href="#" class="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
        <a href="#" class="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
      </div>
    </div>
  </div>
</footer>
  `.trim();
}

/**
 * Footer variants
 */
export const footerVariants = {
  'multi-column': (content: FooterContent) => createFooterComponent(content, { variant: 'multi-column' }),
  simple: (content: FooterContent) => createFooterComponent(content, { variant: 'simple' }),
  minimal: (content: FooterContent) => createFooterComponent(content, { variant: 'minimal' })
};
