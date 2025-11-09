import { dirname, join } from 'node:path';
import fs from 'fs-extra';
import { z } from 'zod';
import type { DesignTokenSummary } from '@genie/analyzer';
import { renderComponent } from '@genie/ui-library';
import type { ComponentMatch } from '@genie/ai-services';

import { downloadFavicon } from '../utils/network-utils.js';
import { execCommand, copyTemplate, writeFile } from '../utils/file-utils.js';
import { generateNavigationComponent } from '../generators/navigation.js';
import { generateFooterComponent, type FooterConfig } from '../generators/footer.js';
import { generatePageComponent } from '../generators/pages.js';
import { generateGlobalsCSS, generateCSSVariables, type ColorPalette } from '@genie/analyzer';

export interface ProjectGenerationConfig {
  outputDir: string;
  projectName: string;
  pages: Array<{
    url: string;
    title?: string;
    html: string;
    path: string;
    summary?: {
      url: string;
      title?: string;
      metaDescription?: string;
      mainHeading?: string;
      contentPreview?: string;
    };
    contentSlices?: Array<{
      type: string;
      content: string;
      metadata?: Record<string, unknown>;
    }>;
    componentMatches?: ComponentMatch[]; // Component-based approach
  }>;
  designTokens: DesignTokenSummary;
  navigation?: Array<{ url: string; text: string }>;
  footer?: FooterConfig;
  colorPalette?: ColorPalette;
  themeTokens?: {
    colors: string[];
    fonts: string[];
    spacingScale: number[];
    borderRadius?: number[];
    shadows?: string[];
    requiredComponents?: string[];
  };
}

export interface GenerationResult {
  fileCount: number;
  totalSize: number;
  projectDir: string;
}

const fileConfigSchema = z.object({
  template: z.string(),
  context: z.record(z.string(), z.any()).default({})
});

const generationSchema = z.object({
  outputDir: z.string(),
  files: z.record(z.string(), fileConfigSchema)
});

/**
 * Generate Next.js project using component-based approach
 */
export const generateNextJSProjectFromComponents = async (config: ProjectGenerationConfig): Promise<GenerationResult> => {
  const { outputDir, projectName, pages, designTokens, themeTokens, navigation, footer, colorPalette } = config;
  const tokens = themeTokens || designTokens;

  // Clean project name for filesystem
  const cleanProjectName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  console.log(`Creating component-based project: ${cleanProjectName}`);

  const projectDir = join(outputDir, cleanProjectName);

  // Step 0: Download favicon from source website
  let customFaviconPath: string | null = null;
  if (pages.length > 0 && pages[0].url) {
    console.log('Downloading favicon from source website...');
    try {
      customFaviconPath = await downloadFavicon(pages[0].url, projectDir);
      if (customFaviconPath) {
        console.log('✓ Favicon downloaded successfully');
      } else {
        console.log('! Could not download favicon, using template default');
      }
    } catch (error) {
      console.log('! Could not download favicon, using template default');
    }
  }

  // Step 1: Copy template folder to project directory
  try {
    console.log('Copying template folder...');
    const templateDir = join(process.cwd(), '../../apps/api/template');
    await copyTemplate(templateDir, projectDir, customFaviconPath);
    console.log('✓ Template copied successfully');
  } catch (error: any) {
    console.error(`Failed to copy template:`, error);
    throw new Error(`Template copy failed: ${error.message}`);
  }

  // Generate custom globals.css with extracted colors if available
  if (colorPalette) {
    try {
      console.log('Generating custom globals.css with extracted colors...');
      const cssVariables = generateCSSVariables(colorPalette);
      const customGlobalsCSS = generateGlobalsCSS(cssVariables);

      const globalsPath = join(projectDir, 'app', 'globals.css');
      await writeFile(globalsPath, customGlobalsCSS);
      console.log('✓ Custom globals.css generated with extracted color palette');
    } catch (error) {
      console.log('! Failed to generate custom globals.css, using template default');
    }
  }

  // Step 2: Update package.json with project name
  try {
    const packageJsonPath = join(projectDir, 'package.json');
    const packageJson = await fs.readJSON(packageJsonPath);
    packageJson.name = cleanProjectName;
    await fs.writeJSON(packageJsonPath, packageJson, { spaces: 2 });
    console.log('✓ Package.json updated with project name');
  } catch (error: any) {
    console.error(`Failed to update package.json:`, error);
    // Continue anyway, this is not critical
  }

  // Step 3: Generate page content from components
  console.log('Generating component-based page content...');
  const pageContents: Array<{ path: string; content: string }> = [];
  const detectedComponents = new Set<string>();

  for (const page of pages) {
    let pageContent: string | undefined;

    if (page.componentMatches && page.componentMatches.length > 0) {
      // Use component-based generation
      pageContent = generatePageFromComponents(page, page.componentMatches);

      // Track detected components for shadcn installation
      page.componentMatches.forEach(match => {
        // Add basic shadcn components that our HTML generation uses
        detectedComponents.add('button');
        // Add more based on component types if needed
      });
    }

    // Generate page content from component matches if not already generated
    if (!pageContent) {
      pageContent = generatePageComponent(page, tokens);
    }

    pageContents.push({ path: page.path, content: pageContent! });

    // Write page file
    const pagePath = join(projectDir, 'app', page.path === '/' ? 'page.tsx' : `${page.path.slice(1)}/page.tsx`);
    await writeFile(pagePath, pageContent!);
    console.log(`✓ Generated component-based page: ${page.path}`);
  }

  // Add navigation component if provided
  if (navigation && navigation.length > 0) {
    const navigationContent = generateNavigationComponent(navigation);
    const navPath = join(projectDir, 'components', 'navigation.tsx');
    await writeFile(navPath, navigationContent);
    console.log('✓ Generated navigation component');

    // Add navigation component to pageContents for component detection
    pageContents.push({ path: 'components/navigation.tsx', content: navigationContent });
  }

  // Add footer component if provided
  if (footer) {
    const footerContent = generateFooterComponent(footer);
    const footerPath = join(projectDir, 'components', 'footer.tsx');
    await writeFile(footerPath, footerContent);
    console.log('✓ Generated footer component');

    // Add footer component to pageContents for component detection
    pageContents.push({ path: 'components/footer.tsx', content: footerContent });
  }

  // Step 4: Install detected shadcn components
  const uniqueComponents = Array.from(detectedComponents).sort();

  if (uniqueComponents.length > 0) {
    console.log(`Installing ${uniqueComponents.length} shadcn components: ${uniqueComponents.join(', ')}`);

    // Install components one by one
    for (const component of uniqueComponents) {
      try {
        console.log(`Installing shadcn component: ${component}...`);
        await execCommand('pnpm', ['dlx', 'shadcn@latest', 'add', component, '-y'], {
          cwd: projectDir,
          timeout: 60_000
        });
        console.log(`✓ Installed shadcn component: ${component}`);
      } catch (error: any) {
        console.error(`Failed to install shadcn component ${component}:`, error);
        // Continue with other components
      }
    }
  } else {
    console.log('No additional shadcn components needed');
  }

  // Step 5: Update README with project information
  const readmeContent = `# ${projectName}

Generated with Genie (Component-Based Approach).

## Getting Started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

The project includes a \`pnpm-lock.yaml\` file, so \`pnpm install\` will be fast and use the exact dependency versions.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
`;

  await writeFile(join(projectDir, 'README.md'), readmeContent);
  console.log('✓ Updated README.md');

  return {
    fileCount: pages.length,
    totalSize: 0, // Will be calculated when zipping
    projectDir: cleanProjectName // Return the actual project directory name
  };
};

/**
 * Generate a page component from component matches
 */
function generatePageFromComponents(
  page: ProjectGenerationConfig['pages'][0],
  componentMatches: ComponentMatch[]
): string {
  const { summary } = page;

  // Sort components by confidence (highest first)
  const sortedMatches = componentMatches.sort((a, b) => b.confidence - a.confidence);

  // Generate HTML for each component
  const componentHtmls: string[] = [];
  for (const match of sortedMatches) {
    try {
      const html = renderComponent(match.componentId, match.contentMapping);
      componentHtmls.push(html);
    } catch (error) {
      console.warn(`Failed to render component ${match.componentId}:`, error);
      // Continue with other components
    }
  }

  // Ensure we have at least some content (fallback if all components failed)
  let pageContent = componentHtmls.join('\n\n');
  if (!pageContent.trim()) {
    console.warn('No components rendered successfully, using fallback content');
    pageContent = '<div className="min-h-screen flex items-center justify-center">\n        <div className="text-center">\n          <h1 className="text-4xl font-bold mb-4">Welcome</h1>\n          <p className="text-xl text-muted-foreground">This page is being generated...</p>\n        </div>\n      </div>';
  }

  // Create the full page layout
  const pageTitle = summary?.title || 'Page';

  // Generate the complete Next.js page component
  return `'use client';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${pageTitle}',
  description: '${summary?.metaDescription || 'Generated page'}',
};

export default function Page() {
  return (
    <main className="min-h-screen">
      ${pageContent}
    </main>
  );
}`;
}
