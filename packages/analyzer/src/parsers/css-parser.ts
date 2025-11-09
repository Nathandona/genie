import postcss, { type Declaration } from 'postcss';
import valueParser, { type Node as ValueNode } from 'postcss-value-parser';
import { colord } from 'colord';

/**
 * CSS parsing utilities
 */

export function parseCSSString(
  css: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>
): void {
  try {
    const root = postcss.parse(css);

    root.walkDecls((decl) => {
      parseDeclaration(decl.prop, decl.value, colors, fonts, spacing, borderRadius, shadows);
    });
  } catch (error) {
    // If CSS parsing fails, fall back to comprehensive color extraction
    extractAllColorsFromCSS(css, colors);
  }
}

export function parseStyleString(
  css: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>
): void {
  // Split by semicolons and process each declaration
  const declarations = css.split(';').map(d => d.trim()).filter(d => d.length > 0);

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const prop = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();

    parseDeclaration(prop, value, colors, fonts, spacing, borderRadius, shadows);
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
): void {
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

/**
 * Comprehensive color extraction from CSS when PostCSS parsing fails
 */
export function extractAllColorsFromCSS(css: string, colors: Set<string>): void {
  // Remove comments
  const cleanCSS = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Find all potential color values using various patterns
  const colorPatterns = [
    /#[0-9a-fA-F]{3,8}\b/g,  // Hex colors
    /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g,  // rgb()
    /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/g,  // rgba()
    /hsl\(\s*\d+\s*,\s*[\d.]+\%\s*,\s*[\d.]+\%\s*\)/g,  // hsl()
    /hsla\(\s*\d+\s*,\s*[\d.]+\%\s*,\s*[\d.]+\%\s*,\s*[\d.]+\s*\)/g,  // hsla()
    /oklch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)/g,  // oklch()
    /oklab\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)/g,  // oklab()
    /lch\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)/g,  // lch()
    /lab\(\s*[\d.]+\s+[\d.]+\s+[\d.]+\s*\)/g,  // lab()
  ];

  for (const pattern of colorPatterns) {
    let match;
    while ((match = pattern.exec(cleanCSS)) !== null) {
      const colorValue = match[0];
      const color = colord(colorValue);
      if (color.isValid()) {
        colors.add(color.toHex().toLowerCase());
      }
    }
  }

  // Also look for CSS custom properties that might contain colors
  const varPattern = /--[\w-]+:\s*([^;]+)/g;
  let match;
  while ((match = varPattern.exec(cleanCSS)) !== null) {
    const varValue = match[1].trim();
    const color = colord(varValue);
    if (color.isValid()) {
      colors.add(color.toHex().toLowerCase());
    }
  }
}
