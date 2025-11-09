import * as cheerio from 'cheerio';
import { colord } from 'colord';
import { detectComponentPatterns } from '../detectors/components.js';
import { extractAllColorsFromCSS } from './css-parser.js';

/**
 * HTML parsing utilities
 */

export function parseHTMLString(
  html: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>,
  requiredComponents: Set<string>
): void {
  const $ = cheerio.load(html);

  // Detect component patterns for shadcn components
  detectComponentPatterns($, requiredComponents);

  // Extract inline styles
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    parseStyleString(style, colors, fonts, spacing, borderRadius, shadows);
  });

  // Extract styles from style tags
  $('style').each((_, el) => {
    // Try different methods to get CSS content
    let cssContent = $(el).html() || $(el).text() || '';
    if (!cssContent) {
      // Try getting all text content including nested elements
      cssContent = $(el).contents().text() || '';
    }
    if (cssContent.trim()) {
      // For style tag content, just extract colors since we don't need full CSS parsing
      extractAllColorsFromCSS(cssContent, colors);
    }
  });
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

export function parseCSSString(
  css: string,
  colors: Set<string>,
  fonts: Set<string>,
  spacing: Set<number>,
  borderRadius: Set<number>,
  shadows: Set<string>
): void {
  // For HTML style tags, just use the CSS parser
  // This is a simplified version - the full CSS parser handles PostCSS parsing
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
  // Extract colors
  const colorValues = value.split(/[,()]/).map(v => v.trim()).filter(v => v.length > 0);
  for (const val of colorValues) {
    addColor(val, colors);
  }

  // Extract spacing values
  if (prop.includes('margin') || prop.includes('padding') || prop.includes('gap')) {
    const numeric = parseFloat(value);
    if (!isNaN(numeric) && numeric >= 0 && numeric <= 2000) {
      spacing.add(Math.round(numeric));
    }
  }

  // Extract border radius
  if (prop.includes('border-radius') || prop.includes('radius')) {
    const numeric = parseFloat(value);
    if (!isNaN(numeric) && numeric >= 0 && numeric <= 100) {
      borderRadius.add(Math.round(numeric));
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
}

function addColor(colorValue: string, colors: Set<string>): void {
  // Skip empty values and non-color keywords
  if (!colorValue || colorValue === 'none' || colorValue === 'transparent' || colorValue === 'inherit' || colorValue === 'initial' || colorValue === 'unset') {
    return;
  }

  // Try to parse as color
  const color = colord(colorValue);
  if (color.isValid()) {
    colors.add(color.toHex().toLowerCase());
  }
}
