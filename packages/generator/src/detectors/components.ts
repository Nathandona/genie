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
