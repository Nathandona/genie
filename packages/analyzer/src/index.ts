/**
 * Genie Analyzer - Design System Analysis Package
 *
 * This package provides utilities for analyzing websites and extracting design tokens,
 * color palettes, content slices, and component requirements.
 */

// Re-export core analysis functionality
export { analyzeDesignTokens, analyzeDesignSystem, analyzePage, extractContentSlices } from './core/analyzer.js';
export type { DesignTokenSummary, AnalysisResult } from './core/analyzer.js';

// Re-export color extraction utilities
export { extractAllColors, generateColorPalette } from './extractors/color-extractor.js';
export { generateCSSVariables, generateGlobalsCSS } from './extractors/color-extractor.js';
export type { ColorPalette, ColorAnalysis, CSSVariables } from './extractors/color-extractor.js';

// Re-export parsing utilities
export { parseHTMLString, parseStyleString, parseCSSString } from './parsers/html-parser.js';
export { parseCSSString as parseCSSFromString, parseStyleString as parseCSSStyleString, extractAllColorsFromCSS } from './parsers/css-parser.js';

// Re-export component detection
export { detectComponentPatterns, detectShadcnComponentsFromPages } from './detectors/components.js';

// Note: preview-refine functionality has been moved to a separate module

