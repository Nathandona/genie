import { ContactContent } from '../types/component-interfaces.js';

/**
 * Contact component factory
 */
export function createContactComponent(content: ContactContent, options?: { variant?: string; className?: string }): string {
  const { variant = 'form-left', className = '' } = options || {};
  const { title, subtitle, description, email, phone, address, form } = content;

  const contactInfo = `
    <div class="space-y-6">
      ${title ? `<h2 class="text-3xl font-bold">${title}</h2>` : ''}
      ${subtitle ? `<p class="text-lg text-muted-foreground">${subtitle}</p>` : ''}
      ${description ? `<p class="text-muted-foreground mb-8">${description}</p>` : ''}

      <div class="space-y-4">
        ${email ? `
          <div class="flex items-center space-x-3">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            <span class="text-muted-foreground">${email}</span>
          </div>
        ` : ''}
        ${phone ? `
          <div class="flex items-center space-x-3">
            <svg class="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            <span class="text-muted-foreground">${phone}</span>
          </div>
        ` : ''}
        ${address ? `
          <div class="flex items-start space-x-3">
            <svg class="h-5 w-5 text-primary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span class="text-muted-foreground">${address.replace(/\n/g, '<br>')}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const formHtml = form ? `
    <form class="space-y-6">
      ${form.fields.map(field => {
        const inputClasses = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

        if (field.type === 'textarea') {
          return `
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                ${field.label}
              </label>
              <textarea
                name="${field.name}"
                placeholder="${field.placeholder || ''}"
                ${field.required ? 'required' : ''}
                class="${inputClasses} min-h-[80px] resize-none"
              ></textarea>
            </div>
          `;
        }

        return `
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              ${field.label}
            </label>
            <input
              type="${field.type}"
              name="${field.name}"
              placeholder="${field.placeholder || ''}"
              ${field.required ? 'required' : ''}
              class="${inputClasses}"
            />
          </div>
        `;
      }).join('')}
      <button type="submit" class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full">
        Send Message
      </button>
    </form>
  ` : '';

  return `
<section class="py-20 lg:py-32 ${className}">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      <div class="order-2 lg:order-1">
        ${contactInfo}
      </div>
      <div class="order-1 lg:order-2">
        ${formHtml}
      </div>
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Contact variants
 */
export const contactVariants = {
  'form-left': (content: ContactContent) => createContactComponent(content, { variant: 'form-left' }),
  'form-right': (content: ContactContent) => createContactComponent(content, { variant: 'form-right' }),
  'centered': (content: ContactContent) => createContactComponent(content, { variant: 'centered' })
};
