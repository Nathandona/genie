import fs from 'fs-extra';
import path from 'node:path';
import type { ProjectGenerationConfig } from '../core/project-generator.js';

/**
 * Component manifest structure
 */
interface ComponentManifest {
  version: string;
  description: string;
  components: Record<string, ComponentInfo>;
  sharedDependencies: Record<string, string | string[]>;
  coreDependencies: Record<string, string>;
}

interface ComponentInfo {
  files: string[];
  dependencies: string[];
  description: string;
}

/**
 * Load component manifest from template directory
 */
async function loadComponentManifest(templateDir: string): Promise<ComponentManifest> {
  const manifestPath = path.join(templateDir, 'components-manifest.json');
  return await fs.readJSON(manifestPath);
}

/**
 * Get all required components for a project based on generated content
 */
export function getRequiredComponents(pageContents: Array<{ path: string; content: string }>): string[] {
  const components = new Set<string>();

  // Regex to match shadcn component imports
  const importRegex = /import\s+(?:{[\s\S]*?}|\*\s+as\s+\w+|\w+)\s+from\s+["']@\/components\/ui\/([\w-]+)["']/g;

  // Known component mappings (for hooks, etc.)
  const componentNameMap: Record<string, string> = {
    // Add mappings if needed for special cases
  };

  for (const { content } of pageContents) {
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      let componentName = match[1];

      // Skip hooks (things starting with "use-")
      if (componentName.startsWith('use-')) {
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

      components.add(componentName);
    }
  }

  return Array.from(components).sort();
}

/**
 * Get all dependencies required for the specified components
 */
export async function getComponentDependencies(
  componentNames: string[],
  templateDir: string
): Promise<string[]> {
  const manifest = await loadComponentManifest(templateDir);
  const allDependencies = new Set<string>();

  for (const componentName of componentNames) {
    const componentInfo = manifest.components[componentName];
    if (componentInfo) {
      componentInfo.dependencies.forEach(dep => allDependencies.add(dep));
    }
  }

  return Array.from(allDependencies).sort();
}

/**
 * Include only the required shadcn components in the generated project
 */
export async function includeRequiredComponents(
  projectDir: string,
  templateDir: string,
  requiredComponents: string[]
): Promise<void> {
  if (requiredComponents.length === 0) {
    console.log('No shadcn components required');
    return;
  }

  console.log(`Including ${requiredComponents.length} shadcn components: ${requiredComponents.join(', ')}`);

  const manifest = await loadComponentManifest(templateDir);

  // Copy each required component
  for (const componentName of requiredComponents) {
    const componentInfo = manifest.components[componentName];
    if (!componentInfo) {
      console.warn(`Component '${componentName}' not found in manifest, skipping`);
      continue;
    }

    // Copy component files
    for (const filePath of componentInfo.files) {
      const sourcePath = path.join(templateDir, filePath);
      const destPath = path.join(projectDir, filePath);

      try {
        await fs.ensureDir(path.dirname(destPath));
        await fs.copy(sourcePath, destPath);
        console.log(`✓ Included component file: ${filePath}`);
      } catch (error) {
        console.error(`Failed to copy component file ${filePath}:`, error);
      }
    }
  }

  console.log('✓ Component inclusion completed');
}

/**
 * Update package.json with required component dependencies
 */
export async function updatePackageJsonWithComponentDeps(
  projectDir: string,
  templateDir: string,
  requiredComponents: string[]
): Promise<void> {
  if (requiredComponents.length === 0) {
    return;
  }

  const manifest = await loadComponentManifest(templateDir);
  const templatePackageJson = await fs.readJSON(path.join(templateDir, 'package.json'));
  const projectPackageJsonPath = path.join(projectDir, 'package.json');
  const projectPackageJson = await fs.readJSON(projectPackageJsonPath);

  // Get all required dependencies
  const requiredDeps = new Set<string>();
  for (const componentName of requiredComponents) {
    const componentInfo = manifest.components[componentName];
    if (componentInfo) {
      componentInfo.dependencies.forEach(dep => requiredDeps.add(dep));
    }
  }

  // Add component-specific dependencies to project package.json
  if (!projectPackageJson.dependencies) {
    projectPackageJson.dependencies = {};
  }

  for (const dep of requiredDeps) {
    if (templatePackageJson.dependencies[dep]) {
      projectPackageJson.dependencies[dep] = templatePackageJson.dependencies[dep];
    }
  }

  // Write updated package.json
  await fs.writeJSON(projectPackageJsonPath, projectPackageJson, { spaces: 2 });
  console.log('✓ Updated package.json with component dependencies');
}
