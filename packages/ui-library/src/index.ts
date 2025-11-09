/**
 * UI Library for Genie - Component-based website generation
 */

// Export types
export * from './types/component-interfaces.js';

// Export registry
export * from './registry/component-registry.js';
export * from './registry/component-registrations.js';

// Export component factories
export * from './components/hero.js';
export * from './components/features.js';
export * from './components/pricing.js';
export * from './components/testimonials.js';
export * from './components/footer.js';
export * from './components/navigation.js';
export * from './components/contact.js';
export * from './components/about.js';
export * from './components/stats.js';

// Export utilities
export * from './utils/component-utils.js';

// Initialize registry on import
import { initializeComponentRegistry } from './registry/component-registrations.js';
initializeComponentRegistry();
