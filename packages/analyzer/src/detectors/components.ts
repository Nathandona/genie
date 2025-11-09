import type { CheerioAPI } from 'cheerio';

/**
 * Component detection utilities
 */

export function detectComponentPatterns($: CheerioAPI, components: Set<string>): void {
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

/**
 * Detect shadcn components from page content by parsing import statements
 * Looks for imports like: import { Button } from "@/components/ui/button"
 * Filters out hooks (use-*) and other non-component imports
 */
export function detectShadcnComponentsFromPages(pageContents: Array<{ path: string; content: string }>): string[] {
  const components = new Set<string>();

  // Regex to match shadcn component imports
  // Matches: import ... from "@/components/ui/button" or '@/components/ui/button'
  const importRegex = /import\s+(?:{[\s\S]*?}|\*\s+as\s+\w+|\w+)\s+from\s+["']@\/components\/ui\/([\w-]+)["']/g;

  // Common shadcn component names (for validation)
  const validShadcnComponents = new Set([
    'accordion', 'alert-dialog', 'aspect-ratio', 'avatar', 'badge', 'button',
    'calendar', 'card', 'carousel', 'chart', 'checkbox', 'collapsible', 'command',
    'context-menu', 'dialog', 'drawer', 'dropdown-menu', 'form', 'hover-card',
    'input', 'label', 'menubar', 'navigation-menu', 'popover', 'progress', 'radio-group',
    'scroll-area', 'select', 'separator', 'sheet', 'skeleton', 'slider',
    'switch', 'table', 'tabs', 'textarea', 'toggle', 'tooltip'
    // Note: 'alert', 'sonner', and 'toast' components are not allowed
  ]);

  // Map component name variations to actual shadcn component names
  const componentNameMap: Record<string, string> = {
    // No mappings needed since toast/sonner components are not allowed
  };

  for (const { content } of pageContents) {
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      let componentName = match[1];

      // Skip hooks (things starting with "use-")
      if (componentName.startsWith('use-')) {
        // Map hooks to their corresponding components
        if (componentNameMap[componentName]) {
          componentName = componentNameMap[componentName];
        } else {
          continue; // Skip unknown hooks
        }
      }

      // Map known variations
      if (componentNameMap[componentName]) {
        componentName = componentNameMap[componentName];
      }

      // Only add if it's a valid shadcn component
      if (validShadcnComponents.has(componentName)) {
        components.add(componentName);
      }
    }
  }

  return Array.from(components);
}
