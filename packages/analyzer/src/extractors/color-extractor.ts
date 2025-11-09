import { colord, type Colord } from 'colord';

/**
 * Enhanced color extraction from websites
 */

export interface ColorPalette {
  primary: string[];
  secondary: string[];
  accent: string[];
  neutral: string[];
  semantic: {
    success: string[];
    warning: string[];
    error: string[];
    info: string[];
  };
  background: string[];
  text: string[];
}

export interface ColorAnalysis {
  palette: ColorPalette;
  rawColors: string[];
  dominantColors: string[];
  colorFrequency: Map<string, number>;
}

/**
 * Extract all color values from HTML and CSS content
 */
export function extractAllColors(html?: string, css?: string): ColorAnalysis {
  const rawColors = new Set<string>();
  const colorFrequency = new Map<string, number>();

  // Extract from HTML
  if (html) {
    extractColorsFromHTML(html, rawColors, colorFrequency);
  }

  // Extract from CSS
  if (css) {
    extractColorsFromCSS(css, rawColors, colorFrequency);
  }

  // Convert to arrays and sort by frequency
  const sortedColors = Array.from(rawColors).sort((a, b) => {
    const freqA = colorFrequency.get(a) || 0;
    const freqB = colorFrequency.get(b) || 0;
    return freqB - freqA;
  });

  // Extract dominant colors (top 8-12 most used)
  const dominantColors = sortedColors.slice(0, 12);

  // Generate semantic color palette
  const palette = generateColorPalette(sortedColors);

  return {
    palette,
    rawColors: Array.from(rawColors),
    dominantColors,
    colorFrequency
  };
}

/**
 * Extract colors from HTML content
 */
function extractColorsFromHTML(html: string, colors: Set<string>, frequency: Map<string, number>): void {
  // Extract from inline styles
  const styleRegex = /style="([^"]*)"/gi;
  let match;
  while ((match = styleRegex.exec(html)) !== null) {
    const styleString = match[1];
    extractColorsFromStyleString(styleString, colors, frequency);
  }

  // Extract from style tags
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleTagRegex.exec(html)) !== null) {
    const cssContent = match[1];
    extractColorsFromCSS(cssContent, colors, frequency);
  }

  // Extract from data attributes and classes that might contain color info
  const colorAttributes = [
    /color="([^"]*)"/gi,
    /background-color="([^"]*)"/gi,
    /border-color="([^"]*)"/gi,
    /fill="([^"]*)"/gi,
    /stroke="([^"]*)"/gi
  ];

  for (const regex of colorAttributes) {
    while ((match = regex.exec(html)) !== null) {
      const colorValue = match[1];
      addColor(colorValue, colors, frequency);
    }
  }
}

/**
 * Extract colors from CSS content
 */
function extractColorsFromCSS(css: string, colors: Set<string>, frequency: Map<string, number>): void {
  // Match CSS color values in various formats
  const colorRegex = /(?:color|background|background-color|border|border-color|outline|outline-color|text-shadow|box-shadow|fill|stroke):\s*([^;{}]+);/gi;

  let match;
  while ((match = colorRegex.exec(css)) !== null) {
    const colorValue = match[1].trim();
    extractColorsFromStyleString(colorValue, colors, frequency);
  }

  // Also check for CSS custom properties (variables)
  const varRegex = /--[\w-]+:\s*([^;{}]+);/gi;
  while ((match = varRegex.exec(css)) !== null) {
    const varValue = match[1].trim();
    addColor(varValue, colors, frequency);
  }
}

/**
 * Extract colors from a CSS style string
 */
function extractColorsFromStyleString(styleString: string, colors: Set<string>, frequency: Map<string, number>): void {
  // Split by semicolons and process each declaration
  const declarations = styleString.split(';');

  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(':');
    if (colonIndex === -1) continue;

    const value = declaration.substring(colonIndex + 1).trim();

    // Handle multiple values (like in box-shadow, background, etc.)
    const values = value.split(/[,()]/).map(v => v.trim()).filter(v => v.length > 0);

    for (const val of values) {
      addColor(val, colors, frequency);
    }
  }
}

/**
 * Add a color to the set if it's valid
 */
function addColor(colorValue: string, colors: Set<string>, frequency: Map<string, number>): void {
  // Skip empty values and non-color keywords
  if (!colorValue || colorValue === 'none' || colorValue === 'transparent' || colorValue === 'inherit' || colorValue === 'initial' || colorValue === 'unset') {
    return;
  }

  // Try to parse as color
  const color = colord(colorValue);
  if (color.isValid()) {
    const hexColor = color.toHex().toLowerCase();
    colors.add(hexColor);

    // Track frequency
    const currentFreq = frequency.get(hexColor) || 0;
    frequency.set(hexColor, currentFreq + 1);
  }
}

/**
 * Generate a semantic color palette from extracted colors
 */
function generateColorPalette(colors: string[]): ColorPalette {
  const palette: ColorPalette = {
    primary: [],
    secondary: [],
    accent: [],
    neutral: [],
    semantic: {
      success: [],
      warning: [],
      error: [],
      info: []
    },
    background: [],
    text: []
  };

  // Categorize colors by hue and lightness
  const categorizedColors = colors.map(color => {
    const colordColor = colord(color);
    const hsl = colordColor.toHsl();

    return {
      color,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l,
      chroma: hsl.s * hsl.l // Approximation of chroma for now
    };
  });

  // Sort by lightness and saturation for better categorization
  categorizedColors.sort((a, b) => {
    if (Math.abs(a.lightness - b.lightness) > 0.2) {
      return b.lightness - a.lightness; // Prefer brighter colors first
    }
    return b.saturation - a.saturation; // Then more saturated
  });

  // Extract primary colors (most saturated, medium lightness)
  const primaryCandidates = categorizedColors.filter(c =>
    c.saturation > 30 && c.lightness > 20 && c.lightness < 80
  );
  palette.primary = primaryCandidates.slice(0, 3).map(c => c.color);

  // Extract secondary colors (complementary or analogous to primary)
  if (palette.primary.length > 0) {
    const primaryHue = categorizedColors.find(c => c.color === palette.primary[0])?.hue || 0;
    const secondaryCandidates = categorizedColors.filter(c =>
      c.color !== palette.primary[0] &&
      Math.abs(c.hue - primaryHue) > 30 && // Not too similar to primary
      c.saturation > 20
    );
    palette.secondary = secondaryCandidates.slice(0, 3).map(c => c.color);
  }

  // Extract accent colors (bright, saturated)
  const accentCandidates = categorizedColors.filter(c =>
    c.saturation > 50 && c.lightness > 30 && c.lightness < 90
  );
  palette.accent = accentCandidates.slice(0, 2).map(c => c.color);

  // Extract neutral colors (low saturation)
  const neutralCandidates = categorizedColors.filter(c => c.saturation < 20);
  palette.neutral = neutralCandidates.slice(0, 4).map(c => c.color);

  // Extract background colors (very light)
  const backgroundCandidates = categorizedColors.filter(c => c.lightness > 90);
  palette.background = backgroundCandidates.slice(0, 3).map(c => c.color);

  // Extract text colors (very dark or very light)
  const textCandidates = categorizedColors.filter(c =>
    c.lightness < 20 || c.lightness > 80
  );
  palette.text = textCandidates.slice(0, 3).map(c => c.color);

  // Semantic colors (green for success, yellow for warning, red for error, blue for info)
  const successCandidates = categorizedColors.filter(c =>
    (c.hue >= 80 && c.hue <= 160) && c.saturation > 30 // Green hues
  );
  palette.semantic.success = successCandidates.slice(0, 2).map(c => c.color);

  const warningCandidates = categorizedColors.filter(c =>
    (c.hue >= 40 && c.hue <= 80) && c.saturation > 30 // Yellow hues
  );
  palette.semantic.warning = warningCandidates.slice(0, 2).map(c => c.color);

  const errorCandidates = categorizedColors.filter(c =>
    ((c.hue >= 0 && c.hue <= 20) || (c.hue >= 340 && c.hue <= 360)) && c.saturation > 30 // Red hues
  );
  palette.semantic.error = errorCandidates.slice(0, 2).map(c => c.color);

  const infoCandidates = categorizedColors.filter(c =>
    (c.hue >= 200 && c.hue <= 280) && c.saturation > 30 // Blue hues
  );
  palette.semantic.info = infoCandidates.slice(0, 2).map(c => c.color);

  return palette;
}

// Re-export CSS generation functions
export { generateCSSVariables, generateGlobalsCSS } from '../generators/css-generator.js';
export type { CSSVariables } from '../generators/css-generator.js';

// Export the generateColorPalette function
export { generateColorPalette };
