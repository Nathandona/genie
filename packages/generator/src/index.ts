/**
 * Genie Generator - Modular Next.js Project Generator
 *
 * This package provides utilities for generating Next.js projects from crawled website data.
 * It uses shadcn/ui components and supports AI-generated content.
 */

// Re-export preview-refine functionality
export { previewAndRefine } from './preview-refine.js';
export type { PreviewRefineConfig, RefinedPage } from './preview-refine.js';

// Re-export core generation functionality
export { generateNextJSProjectFromComponents } from './core/project-generator.js';
export type { ProjectGenerationConfig, GenerationResult } from './core/project-generator.js';

// Re-export utility functions for advanced usage
export { toRelativeHref } from './utils/url-utils.js';
export { downloadFavicon } from './utils/network-utils.js';
export { execCommand, ensureDirectory, writeFile, copyTemplate } from './utils/file-utils.js';

// Re-export generators
export { generateNavigationComponent } from './generators/navigation.js';
export { generateFooterComponent, type FooterConfig } from './generators/footer.js';
export { generatePageComponent } from './generators/pages.js';

// Re-export detectors
export { detectShadcnComponentsFromPages } from './detectors/components.js';

// Re-export component inclusion utilities
export {
  getRequiredComponents,
  getComponentDependencies,
  includeRequiredComponents,
  updatePackageJsonWithComponentDeps
} from './utils/component-inclusion.js';
