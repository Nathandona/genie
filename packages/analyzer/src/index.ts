import postcss, { type Declaration } from 'postcss';
import valueParser, { type Node as ValueNode } from 'postcss-value-parser';
import { colord } from 'colord';
import { z } from 'zod';
import * as cheerio from 'cheerio';

export interface DesignTokenSummary {
  colors: string[];
  fonts: string[];
  spacingScale: number[];
  borderRadius?: number[];
  shadows?: string[];
  requiredComponents?: string[]; // shadcn components needed
}

const analyzerInputSchema = z.object({
  html: z.string().optional(),
  css: z.string().optional()
});

export const analyzeDesignTokens = (input: z.infer<typeof analyzerInputSchema>): DesignTokenSummary => {
  const { html, css } = analyzerInputSchema.parse(input);

  const colors = new Set<string>();
  const fonts = new Set<string>();
  const spacing = new Set<number>();
  const borderRadius = new Set<number>();
  const shadows = new Set<string>();
  const requiredComponents = new Set<string>();

  // Extract from HTML inline styles and style tags
  if (html) {
    const $ = cheerio.load(html);
    
    // Detect component patterns for shadcn components
    detectComponentPatterns($, requiredComponents);
    
    // Extract inline styles
    $('[style]').each((_, el) => {
      const style = $(el).attr('style') || '';
      parseStyleString(style, colors, fonts, spacing, borderRadius, shadows);
    });

    // Extract from <style> tags
    $('style').each((_, el) => {
      const cssContent = $(el).html() || '';
      parseCSSString(cssContent, colors, fonts, spacing, borderRadius, shadows);
    });
  }

  // Extract from CSS string
  if (css) {
    parseCSSString(css, colors, fonts, spacing, borderRadius, shadows);
  }

  return {
    colors: Array.from(colors).slice(0, 12).sort(),
    fonts: Array.from(fonts).filter(f => f.length > 0),
    spacingScale: Array.from(spacing).sort((a, b) => a - b),
    borderRadius: Array.from(borderRadius).sort((a, b) => a - b),
    shadows: Array.from(shadows).slice(0, 10),
    requiredComponents: Array.from(requiredComponents)
  };
};

function parseStyleString(
  style: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>
) {
  const declarations = style.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const decl of declarations) {
    const [prop, ...valueParts] = decl.split(':').map(s => s.trim());
    if (!prop || valueParts.length === 0) continue;
    const value = valueParts.join(':');
    parseDeclaration(prop, value, colors, fonts, spacing, borderRadius, shadows);
  }
}

function parseCSSString(
  css: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>
) {
  try {
    const root = postcss.parse(css);
    root.walkDecls((decl: Declaration) => {
      parseDeclaration(decl.prop, decl.value, colors, fonts, spacing, borderRadius, shadows);
    });
  } catch {
    // If CSS parsing fails, try simple regex extraction
    parseStyleString(css, colors, fonts, spacing, borderRadius, shadows);
  }
}

function detectComponentPatterns($: cheerio.CheerioAPI, components: Set<string>): void {
  const html = $.html().toLowerCase();
  
  // Detect buttons
  if (html.includes('<button') || html.includes('button') || html.match(/role=["']button["']/i)) {
    components.add('button');
  }
  
  // Detect cards
  if (html.includes('card') || html.match(/class=["'][^"']*card[^"']*["']/i)) {
    components.add('card');
  }
  
  // Detect forms and inputs
  if (html.includes('<form') || html.includes('<input') || html.includes('input[type')) {
    components.add('input');
    components.add('label');
    if (html.includes('select') || html.includes('<select')) {
      components.add('select');
    }
    if (html.includes('textarea') || html.includes('<textarea')) {
      components.add('textarea');
    }
    if (html.includes('checkbox') || html.match(/type=["']checkbox["']/i)) {
      components.add('checkbox');
    }
    if (html.includes('radio') || html.match(/type=["']radio["']/i)) {
      components.add('radio-group');
    }
  }
  
  // Detect dialogs/modals
  if (html.includes('modal') || html.includes('dialog') || html.match(/role=["']dialog["']/i)) {
    components.add('dialog');
  }
  
  // Detect dropdowns/menus
  if (html.includes('dropdown') || html.includes('menu') || html.match(/role=["']menu["']/i)) {
    components.add('dropdown-menu');
  }
  
  // Detect navigation
  if (html.includes('<nav') || html.includes('navigation') || html.match(/role=["']navigation["']/i)) {
    components.add('navigation-menu');
  }
  
  // Detect tabs
  if (html.includes('tab') || html.match(/role=["']tab["']/i)) {
    components.add('tabs');
  }
  
  // Detect accordion
  if (html.includes('accordion') || html.match(/role=["']region["']/i)) {
    components.add('accordion');
  }
  
  // Detect alerts
  if (html.includes('alert') || html.match(/role=["']alert["']/i)) {
    components.add('alert');
  }
  
  // Detect badges
  if (html.includes('badge') || html.match(/class=["'][^"']*badge[^"']*["']/i)) {
    components.add('badge');
  }
  
  // Detect tooltips
  if (html.includes('tooltip') || html.match(/title=["'][^"']+["']/i)) {
    components.add('tooltip');
  }
  
  // Detect popover
  if (html.includes('popover') || html.match(/role=["']tooltip["']/i)) {
    components.add('popover');
  }
  
  // Detect table
  if (html.includes('<table') || html.includes('<thead') || html.includes('<tbody')) {
    components.add('table');
  }
  
  // Detect separator
  if (html.includes('<hr') || html.match(/class=["'][^"']*separator[^"']*["']/i)) {
    components.add('separator');
  }
  
  // Detect skeleton/loading states
  if (html.includes('skeleton') || html.includes('loading') || html.match(/class=["'][^"']*skeleton[^"']*["']/i)) {
    components.add('skeleton');
  }
  
  // Detect switch/toggle
  if (html.includes('switch') || html.includes('toggle') || html.match(/role=["']switch["']/i)) {
    components.add('switch');
  }
  
  // Detect slider
  if (html.includes('slider') || html.includes('range') || html.match(/type=["']range["']/i)) {
    components.add('slider');
  }
  
  // Detect progress
  if (html.includes('progress') || html.includes('<progress') || html.match(/role=["']progressbar["']/i)) {
    components.add('progress');
  }
  
  // Detect toast/notification
  if (html.includes('toast') || html.includes('notification')) {
    components.add('toast');
  }
  
  // Detect sheet/sidebar
  if (html.includes('sheet') || html.includes('sidebar') || html.includes('drawer')) {
    components.add('sheet');
  }
  
  // Detect avatar
  if (html.includes('avatar') || html.match(/class=["'][^"']*avatar[^"']*["']/i)) {
    components.add('avatar');
  }
  
  // Detect scroll-area
  if (html.includes('scroll') || html.match(/class=["'][^"']*scroll[^"']*["']/i)) {
    components.add('scroll-area');
  }
}

function parseDeclaration(
  prop: string,
  value: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>
) {
  const parsed = valueParser(value);
  
  parsed.walk((node: ValueNode) => {
    if (node.type === 'word' || node.type === 'string') {
      const val = node.type === 'string' ? node.value.replace(/['"]/g, '') : node.value;
      
      // Extract colors
      const color = colord(val);
      if (color.isValid()) {
        colors.add(color.toHex().toLowerCase());
      }

      // Extract spacing values
      if (prop.includes('margin') || prop.includes('padding') || prop.includes('gap')) {
        const numeric = parseFloat(val);
        if (!isNaN(numeric) && numeric >= 0 && numeric <= 2000) {
          spacing.add(Math.round(numeric));
        }
      }

      // Extract border radius
      if (prop.includes('border-radius') || prop.includes('radius')) {
        const numeric = parseFloat(val);
        if (!isNaN(numeric) && numeric >= 0 && numeric <= 100) {
          borderRadius.add(Math.round(numeric));
        }
      }
    }

    // Extract font families
    if (prop === 'font-family' || prop === 'font') {
      const fontValue = value.replace(/['"]/g, '').split(',')[0].trim();
      if (fontValue && !fontValue.match(/^(serif|sans-serif|monospace|inherit|initial|unset)$/i)) {
        fonts.add(fontValue);
      }
    }

    // Extract box shadows
    if (prop.includes('shadow') && value.includes('rgb') || value.includes('#')) {
      shadows.add(value.trim());
    }
  });
}
