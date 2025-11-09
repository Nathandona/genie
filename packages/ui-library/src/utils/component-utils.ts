import { ComponentType, ComponentContent, COMPONENT_SCHEMAS } from '../types/component-interfaces.js';
import { componentRegistry } from '../registry/component-registry.js';

/**
 * Validate component content against its schema
 */
export function validateComponentContent(type: ComponentType, content: unknown): {
  success: boolean;
  errors?: string[];
  data?: ComponentContent;
} {
  const schema = COMPONENT_SCHEMAS[type];
  const result = schema.safeParse(content);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return {
      success: false,
      errors: result.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`)
    };
  }
}

/**
 * Render a component by ID with content
 */
export function renderComponent(
  componentId: string,
  content: ComponentContent,
  options?: { variant?: string; className?: string }
): string {
  const component = componentRegistry.get(componentId);
  if (!component) {
    throw new Error(`Component with id '${componentId}' not found`);
  }

  // Validate content
  const validation = validateComponentContent(component.metadata.type, content);
  if (!validation.success) {
    throw new Error(`Invalid content for component ${componentId}: ${validation.errors?.join(', ')}`);
  }

  return component.factory(validation.data!, options);
}

/**
 * Get available components for a specific type
 */
export function getComponentsByType(type: ComponentType) {
  return componentRegistry.getByType(type);
}

/**
 * Check if a component type is supported
 */
export function isComponentTypeSupported(type: string): type is ComponentType {
  return componentRegistry.getAvailableTypes().includes(type as ComponentType);
}

/**
 * Get component metadata for all registered components
 */
export function getAllComponentMetadata() {
  return componentRegistry.getAllMetadata();
}

/**
 * Get component preview data for a specific component
 */
export function getComponentPreview(componentId: string) {
  const component = componentRegistry.get(componentId);
  return component?.metadata.preview;
}
