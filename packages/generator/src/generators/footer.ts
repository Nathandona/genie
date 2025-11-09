import { toRelativeHref } from '../utils/url-utils.js';

/**
 * Footer component generation
 */

export interface FooterConfig {
  links?: Array<{ url: string; text: string }>;
  copyright?: string;
  socialLinks?: Array<{ platform: string; url: string; icon?: string }>;
}

export function generateFooterComponent(config: FooterConfig = {}): string {
  const { links = [], copyright = `© ${new Date().getFullYear()} All rights reserved.`, socialLinks = [] } = config;

  const footerLinks = links.length > 0 ? `
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          ${links.map(link => `<a href="${toRelativeHref(link.url)}" className="text-muted-foreground hover:text-foreground transition-colors">${link.text}</a>`).join('\n          ')}
        </div>` : '';

  const socialSection = socialLinks.length > 0 ? `
        <div className="flex justify-center space-x-4 mb-4">
          ${socialLinks.map(social => `<a href="${social.url}" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">${social.icon || social.platform}</a>`).join('\n          ')}
        </div>` : '';

  return `'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center">${footerLinks}${socialSection}
        <p className="text-sm text-muted-foreground">
          ${copyright}
        </p>
      </div>
    </footer>
  );
}
`;
}
