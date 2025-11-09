import { describe, it, expect } from 'vitest';
import { generateFooterComponent } from '../generators/footer.js';
import { generateNavigationComponent } from '../generators/navigation.js';

describe('Component Generation - Footer & Navigation', () => {
  describe('Footer Generation', () => {
    it('should generate basic footer with default copyright', () => {
      const footer = generateFooterComponent();

      expect(footer).toContain('export default function Footer');
      expect(footer).toContain('© 2025 All rights reserved.');
      expect(footer).toContain('<footer className="bg-background border-t border-border mt-auto">');
      expect(footer).toContain('<div className="container mx-auto px-4 py-8">');
    });

    it('should generate footer with custom links', () => {
      const footer = generateFooterComponent({
        links: [
          { url: '/about', text: 'About Us' },
          { url: '/contact', text: 'Contact' },
          { url: '/privacy', text: 'Privacy Policy' }
        ]
      });

      expect(footer).toContain('<a href="/about" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a>');
      expect(footer).toContain('<a href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>');
      expect(footer).toContain('<a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>');
      expect(footer).toContain('© 2025 All rights reserved.');
    });

    it('should generate footer with custom copyright', () => {
      const footer = generateFooterComponent({
        copyright: '© 2024 My Awesome Company. All rights reserved.'
      });

      expect(footer).toContain('© 2024 My Awesome Company. All rights reserved.');
      expect(footer).not.toContain('© 2025 All rights reserved.');
    });

    it('should generate footer with social links', () => {
      const footer = generateFooterComponent({
        socialLinks: [
          { platform: 'Twitter', url: 'https://twitter.com/company', icon: '🐦' },
          { platform: 'GitHub', url: 'https://github.com/company', icon: '💻' }
        ]
      });

      expect(footer).toContain('<a href="https://twitter.com/company" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">🐦</a>');
      expect(footer).toContain('<a href="https://github.com/company" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">💻</a>');
    });

    it('should generate footer with social links using platform names when no icon', () => {
      const footer = generateFooterComponent({
        socialLinks: [
          { platform: 'Twitter', url: 'https://twitter.com/company' },
          { platform: 'GitHub', url: 'https://github.com/company' }
        ]
      });

      expect(footer).toContain('Twitter</a>');
      expect(footer).toContain('GitHub</a>');
    });

    it('should generate complete footer with all features', () => {
      const footer = generateFooterComponent({
        links: [
          { url: '/about', text: 'About' },
          { url: '/services', text: 'Services' }
        ],
        copyright: '© 2024 Test Company',
        socialLinks: [
          { platform: 'Twitter', url: 'https://twitter.com/test', icon: '🐦' },
          { platform: 'LinkedIn', url: 'https://linkedin.com/company/test' }
        ]
      });

      expect(footer).toContain('<a href="/about"');
      expect(footer).toContain('<a href="/services"');
      expect(footer).toContain('© 2024 Test Company');
      expect(footer).toContain('🐦</a>');
      expect(footer).toContain('LinkedIn</a>');
      expect(footer).toContain('target="_blank"');
      expect(footer).toContain('rel="noopener noreferrer"');
    });

    it('should handle empty footer config gracefully', () => {
      const footer = generateFooterComponent({});

      expect(footer).toContain('© 2025 All rights reserved.');
      expect(footer).not.toContain('<div className="flex flex-wrap justify-center gap-4 mb-4">');
      expect(footer).not.toContain('<div className="flex justify-center space-x-4 mb-4">');
    });
  });

  describe('Navigation Generation', () => {
    it('should generate basic navigation with links', () => {
      const navigation = generateNavigationComponent([
        { url: '/home', text: 'Home' },
        { url: '/about', text: 'About' },
        { url: '/contact', text: 'Contact' }
      ]);

      expect(navigation).toContain('export default function Navigation');
      expect(navigation).toContain('<NavigationMenu>');
      expect(navigation).toContain('<NavigationMenuList>');
      expect(navigation).toContain('<NavigationMenuItem>');
      expect(navigation).toContain('<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>');
      expect(navigation).toContain('<a href="/home"');
      expect(navigation).toContain('<a href="/about"');
      expect(navigation).toContain('<a href="/contact"');
    });

    it('should convert absolute URLs to relative paths', () => {
      const navigation = generateNavigationComponent([
        { url: 'https://example.com/home', text: 'Home' },
        { url: 'https://example.com/about?tab=info', text: 'About' },
        { url: 'https://example.com/contact#form', text: 'Contact' },
        { url: '/products', text: 'Products' }
      ]);

      expect(navigation).toContain('<a href="/home"');
      expect(navigation).toContain('<a href="/about?tab=info"');
      expect(navigation).toContain('<a href="/contact#form"');
      expect(navigation).toContain('<a href="/products"');
    });

    it('should handle empty navigation array', () => {
      const navigation = generateNavigationComponent([]);

      expect(navigation).toContain('<NavigationMenuList>');
      expect(navigation).toContain('</NavigationMenuList>');
      // Should not contain any NavigationMenuItem elements
      expect(navigation.split('<NavigationMenuItem>').length).toBe(1);
    });

    it('should generate proper React component structure', () => {
      const navigation = generateNavigationComponent([
        { url: '/test', text: 'Test' }
      ]);

      expect(navigation).toContain("'use client';");
      expect(navigation).toContain('import Link from \'next/link\';');
      expect(navigation).toContain('import {');
      expect(navigation).toContain('NavigationMenu');
      expect(navigation).toContain('NavigationMenuItem');
      expect(navigation).toContain('NavigationMenuLink');
      expect(navigation).toContain('NavigationMenuList');
      expect(navigation).toContain('navigationMenuTriggerStyle');
      expect(navigation).toContain('} from \'@/components/ui/navigation-menu\';');
    });

    it('should handle special characters in URLs and text', () => {
      const navigation = generateNavigationComponent([
        { url: '/résumé', text: 'Résumé & CV' },
        { url: '/test?param=value&other=test', text: 'Test with & ampersand' }
      ]);

      expect(navigation).toContain('<a href="/résumé"');
      expect(navigation).toContain('<a href="/test?param=value&other=test"');
      expect(navigation).toContain('Résumé & CV</a>');
      expect(navigation).toContain('Test with & ampersand</a>');
    });
  });

  describe('URL Processing', () => {
    it('should handle various URL formats correctly', () => {
      const navigation = generateNavigationComponent([
        { url: 'https://example.com/path', text: 'Absolute' },
        { url: '/relative/path', text: 'Relative' },
        { url: '?query=value', text: 'Query only' },
        { url: '#fragment', text: 'Fragment only' },
        { url: './local', text: 'Local relative' },
        { url: 'mailto:test@example.com', text: 'Mailto' }
      ]);

      expect(navigation).toContain('<a href="/path"');
      expect(navigation).toContain('<a href="/relative/path"');
      expect(navigation).toContain('<a href="?query=value"');
      expect(navigation).toContain('<a href="#fragment"');
      expect(navigation).toContain('<a href="./local"');
      expect(navigation).toContain('<a href="mailto:test@example.com"');
    });
  });
});
