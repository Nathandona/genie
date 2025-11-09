import { z } from 'zod';
import { COMPONENT_TYPES, ComponentType, COMPONENT_SCHEMAS, ComponentContent } from '../types/component-interfaces.js';

/**
 * Component metadata for registry
 */
export interface ComponentMetadata {
  id: string;
  type: ComponentType;
  name: string;
  description: string;
  category: string;
  preview?: {
    thumbnail?: string;
    example?: Record<string, unknown>;
  };
  schema: z.ZodSchema<ComponentContent>;
  defaultProps?: Record<string, unknown>;
  variants?: string[];
}

/**
 * Component factory function type
 */
export type ComponentFactory<T extends ComponentContent = ComponentContent> = (
  content: T,
  options?: {
    variant?: string;
    className?: string;
  }
) => string; // Returns JSX/TSX string

/**
 * Registered component entry
 */
export interface RegisteredComponent<T extends ComponentContent = ComponentContent> {
  metadata: ComponentMetadata;
  factory: ComponentFactory<T>;
}

/**
 * Component registry class
 */
export class ComponentRegistry {
  private components = new Map<string, RegisteredComponent>();

  /**
   * Register a new component
   */
  register<T extends ComponentContent>(
    metadata: ComponentMetadata,
    factory: ComponentFactory<T>
  ): void {
    if (this.components.has(metadata.id)) {
      throw new Error(`Component with id '${metadata.id}' is already registered`);
    }

    // Validate that the type matches a known component type
    if (!COMPONENT_TYPES.includes(metadata.type)) {
      throw new Error(`Unknown component type: ${metadata.type}`);
    }

    // Validate that the schema matches the expected schema for this type
    if (metadata.schema !== COMPONENT_SCHEMAS[metadata.type]) {
      throw new Error(`Schema mismatch for component type: ${metadata.type}`);
    }

    this.components.set(metadata.id, { metadata, factory } as RegisteredComponent);
  }

  /**
   * Get a component by ID
   */
  get<T extends ComponentContent = ComponentContent>(id: string): RegisteredComponent<T> | undefined {
    return this.components.get(id) as RegisteredComponent<T> | undefined;
  }

  /**
   * Get all components of a specific type
   */
  getByType<T extends ComponentContent = ComponentContent>(type: ComponentType): RegisteredComponent<T>[] {
    return Array.from(this.components.values())
      .filter(component => component.metadata.type === type) as RegisteredComponent<T>[];
  }

  /**
   * Get all registered components
   */
  getAll(): RegisteredComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Get component metadata only
   */
  getAllMetadata(): ComponentMetadata[] {
    return Array.from(this.components.values()).map(component => component.metadata);
  }

  /**
   * Check if a component is registered
   */
  has(id: string): boolean {
    return this.components.has(id);
  }

  /**
   * Remove a component from registry
   */
  unregister(id: string): boolean {
    return this.components.delete(id);
  }

  /**
   * Get component types that have registered components
   */
  getAvailableTypes(): ComponentType[] {
    const types = new Set<ComponentType>();
    for (const component of this.components.values()) {
      types.add(component.metadata.type);
    }
    return Array.from(types);
  }

  /**
   * Validate content against component schema
   */
  validateContent(type: ComponentType, content: unknown): boolean {
    const schema = COMPONENT_SCHEMAS[type];
    const result = schema.safeParse(content);
    return result.success;
  }

  /**
   * Get the schema for a component type
   */
  getSchema(type: ComponentType): z.ZodSchema<ComponentContent> {
    return COMPONENT_SCHEMAS[type];
  }
}

/**
 * Global component registry instance
 */
export const componentRegistry = new ComponentRegistry();
