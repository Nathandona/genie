import { NavigationContent } from '../types/component-interfaces.js';

/**
 * Navigation component factory
 */
export function createNavigationComponent(content: NavigationContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'horizontal', className = '' } = options || {};
  const { logo, links, cta } = content;

  const navLinks = links.map(link => {
    const hasChildren = link.children && link.children.length > 0;
    const childrenHtml = hasChildren ? `
      <div class="absolute top-full left-0 mt-2 w-48 bg-background border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
        ${link.children!.map(child => `
          <a href="${child.url}" class="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            ${child.text}
          </a>
        `).join('')}
      </div>
    ` : '';

    return `
    <div class="relative group">
      <a href="${link.url}" class="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ${hasChildren ? 'relative' : ''}">
        ${link.text}
        ${hasChildren ? `
          <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        ` : ''}
      </a>
      ${childrenHtml}
    </div>
    `;
  }).join('');

  const ctaButton = cta ? `
    <a href="${cta.url}" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
      ${cta.text}
    </a>
  ` : '';

  return `
<nav class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}">
  <div class="container mx-auto px-4">
    <div class="flex h-14 items-center justify-between">
      <div class="flex items-center space-x-4">
        ${logo ? `<img src="${logo}" alt="Logo" class="h-8 w-auto" />` : ''}
        <div class="hidden md:flex items-center space-x-6">
          ${navLinks}
        </div>
      </div>
      <div class="flex items-center space-x-4">
        ${ctaButton}
        <!-- Mobile menu button -->
        <button class="md:hidden inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9 p-0">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>
    <!-- Mobile menu -->
    <div class="md:hidden border-t py-4 space-y-2">
      ${links.map(link => `
        <a href="${link.url}" class="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          ${link.text}
        </a>
      `).join('')}
    </div>
  </div>
</nav>
  `.trim();
}

/**
 * Navigation variants
 */
export const navigationVariants = {
  horizontal: (content: NavigationContent) => createNavigationComponent(content, { variant: 'horizontal' }),
  vertical: (content: NavigationContent) => createNavigationComponent(content, { variant: 'vertical' }),
  centered: (content: NavigationContent) => createNavigationComponent(content, { variant: 'centered' })
};
