import { colord } from 'colord';
import type { ColorPalette } from '../extractors/color-extractor.js';

/**
 * Generate CSS custom properties from color palette
 */

export interface CSSVariables {
  [key: string]: string;
}

export function generateCSSVariables(palette: ColorPalette): CSSVariables {
  const variables: CSSVariables = {};

  // Helper function to convert hex to OKLCH approximation
  const hexToOklch = (hex: string) => {
    const colordColor = colord(hex);
    const hsl = colordColor.toHsl();
    // Approximate OKLCH conversion: L = lightness, C = saturation * lightness, H = hue
    const l = hsl.l;
    const c = hsl.s * hsl.l;
    const h = hsl.h;
    return `${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)}`;
  };

  // Primary colors
  palette.primary.forEach((color, index) => {
    variables[`--primary${index > 0 ? `-${index + 1}` : ''}`] = hexToOklch(color);
  });

  // Secondary colors
  palette.secondary.forEach((color, index) => {
    variables[`--secondary${index > 0 ? `-${index + 1}` : ''}`] = hexToOklch(color);
  });

  // Accent colors
  palette.accent.forEach((color, index) => {
    variables[`--accent${index > 0 ? `-${index + 1}` : ''}`] = hexToOklch(color);
  });

  // Neutral colors
  palette.neutral.forEach((color, index) => {
    variables[`--neutral${index > 0 ? `-${index + 1}` : ''}`] = hexToOklch(color);
  });

  // Background colors
  palette.background.forEach((color, index) => {
    variables[`--background${index > 0 ? `-${index + 1}` : ''}`] = hexToOklch(color);
  });

  // Text colors
  palette.text.forEach((color, index) => {
    variables[`--foreground${index > 0 ? `-${index + 1}` : ''}`] = hexToOklch(color);
  });

  // Card colors (use background colors with slight variation)
  if (palette.background.length > 0) {
    const cardColor = colord(palette.background[0]).lighten(0.02);
    variables['--card'] = hexToOklch(cardColor.toHex());
  }

  // Popover colors (use background colors)
  if (palette.background.length > 0) {
    variables['--popover'] = hexToOklch(palette.background[0]);
  }

  // Muted colors (use neutral colors)
  if (palette.neutral.length > 0) {
    variables['--muted'] = hexToOklch(palette.neutral[0]);
  }

  // Accent colors for hover states
  if (palette.accent.length > 0) {
    variables['--accent'] = hexToOklch(palette.accent[0]);
  }

  // Destructive colors (use semantic error colors)
  if (palette.semantic.error.length > 0) {
    variables['--destructive'] = hexToOklch(palette.semantic.error[0]);
  }

  // Border colors (use neutral colors)
  if (palette.neutral.length > 1) {
    variables['--border'] = hexToOklch(palette.neutral[1]);
  }

  // Input colors (use background colors)
  if (palette.background.length > 0) {
    variables['--input'] = hexToOklch(palette.background[0]);
  }

  // Ring colors (use primary colors)
  if (palette.primary.length > 0) {
    variables['--ring'] = hexToOklch(palette.primary[0]);
  }

  // Chart colors (use various colors from palette)
  const chartColors = [
    ...palette.primary,
    ...palette.secondary,
    ...palette.accent,
    ...palette.semantic.success,
    ...palette.semantic.warning,
    ...palette.semantic.error,
    ...palette.semantic.info
  ];

  chartColors.slice(0, 5).forEach((color, index) => {
    variables[`--chart-${index + 1}`] = hexToOklch(color);
  });

  // Sidebar colors (use background and text colors)
  if (palette.background.length > 0) {
    variables['--sidebar'] = hexToOklch(palette.background[0]);
  }

  if (palette.text.length > 0) {
    variables['--sidebar-foreground'] = hexToOklch(palette.text[0]);
  }

  // Sidebar primary (use primary colors)
  if (palette.primary.length > 0) {
    variables['--sidebar-primary'] = hexToOklch(palette.primary[0]);
  }

  // Sidebar accent (use accent colors or secondary)
  const sidebarAccentColor = palette.accent.length > 0 ? palette.accent[0] : (palette.secondary.length > 0 ? palette.secondary[0] : palette.neutral[0]);
  if (sidebarAccentColor) {
    variables['--sidebar-accent'] = hexToOklch(sidebarAccentColor);
  }

  // Generate foreground colors for various elements
  const foregroundElements = ['card', 'popover', 'primary', 'secondary', 'muted', 'accent', 'destructive'];
  foregroundElements.forEach(element => {
    if (variables[`--${element}`]) {
      // For light backgrounds, use dark text; for dark backgrounds, use light text
      const hsl = colord(palette.background[0] || '#ffffff').toHsl();
      const isLight = hsl.l > 0.5;
      const foregroundOklch = isLight
        ? [0.145, 0, 0] // Dark text for light backgrounds
        : [0.985, 0, 0]; // Light text for dark backgrounds
      variables[`--${element}-foreground`] = `${foregroundOklch[0]} ${foregroundOklch[1]} ${foregroundOklch[2]}`;
    }
  });

  return variables;
}

export function generateGlobalsCSS(variables: CSSVariables): string {
  const variableDeclarations = Object.entries(variables)
    .map(([key, value]) => `  ${key}: oklch(${value});`)
    .join('\n');

  return `@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
${variableDeclarations}
}

.dark {
  --background: oklch(var(--background) / 0.1);
  --foreground: oklch(var(--foreground) / 0.9);
  --card: oklch(var(--card) / 0.1);
  --card-foreground: oklch(var(--card-foreground) / 0.9);
  --popover: oklch(var(--popover) / 0.1);
  --popover-foreground: oklch(var(--popover-foreground) / 0.9);
  --primary: oklch(var(--primary) / 0.9);
  --primary-foreground: oklch(var(--primary-foreground) / 0.1);
  --secondary: oklch(var(--secondary) / 0.1);
  --secondary-foreground: oklch(var(--secondary-foreground) / 0.9);
  --muted: oklch(var(--muted) / 0.1);
  --muted-foreground: oklch(var(--muted-foreground) / 0.6);
  --accent: oklch(var(--accent) / 0.1);
  --accent-foreground: oklch(var(--accent-foreground) / 0.9);
  --destructive: oklch(var(--destructive) / 0.9);
  --border: oklch(var(--border) / 0.2);
  --input: oklch(var(--input) / 0.2);
  --ring: oklch(var(--ring) / 0.8);
  --chart-1: oklch(var(--chart-1) / 0.9);
  --chart-2: oklch(var(--chart-2) / 0.9);
  --chart-3: oklch(var(--chart-3) / 0.9);
  --chart-4: oklch(var(--chart-4) / 0.9);
  --chart-5: oklch(var(--chart-5) / 0.9);
  --sidebar: oklch(var(--sidebar) / 0.1);
  --sidebar-foreground: oklch(var(--sidebar-foreground) / 0.9);
  --sidebar-primary: oklch(var(--sidebar-primary) / 0.9);
  --sidebar-primary-foreground: oklch(var(--sidebar-primary-foreground) / 0.1);
  --sidebar-accent: oklch(var(--sidebar-accent) / 0.1);
  --sidebar-accent-foreground: oklch(var(--sidebar-accent-foreground) / 0.9);
  --sidebar-border: oklch(var(--sidebar-border) / 0.2);
  --sidebar-ring: oklch(var(--sidebar-ring) / 0.8);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;
}
