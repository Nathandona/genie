import { dirname, join } from 'node:path';
import fs from 'fs-extra';
import mustache from 'mustache';
import { z } from 'zod';
import type { DesignTokenSummary } from '@genie/analyzer';

import { downloadFavicon } from '../utils/network-utils.js';
import { execCommand, copyTemplate, writeFile } from '../utils/file-utils.js';
import { generateNavigationComponent } from '../generators/navigation.js';
import { generateFooterComponent, type FooterConfig } from '../generators/footer.js';
import { generatePageComponent, generatePageComponentFromAI } from '../generators/pages.js';
import { detectShadcnComponentsFromPages } from '../detectors/components.js';
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
    generatedContent?: string; // AI-generated JSX/TSX content
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
  context: z.record(z.any()).default({})
});

const generationSchema = z.object({
  outputDir: z.string(),
  files: z.record(fileConfigSchema)
});

export type GenerationConfig = z.infer<typeof generationSchema>;

export const generateFromTemplates = async (config: GenerationConfig) => {
  const { outputDir, files } = generationSchema.parse(config);
  await fs.ensureDir(outputDir);

  const tasks = Object.keys(files).map(async relativePath => {
    const fileConfig = files[relativePath];
    const rendered = mustache.render(fileConfig.template, fileConfig.context);
    const destination = join(outputDir, relativePath);
    await fs.ensureDir(dirname(destination));
    await fs.writeFile(destination, rendered, 'utf8');
  });

  await Promise.all(tasks);
};

export const generateNextJSProject = async (config: ProjectGenerationConfig): Promise<GenerationResult> => {
  const { outputDir, projectName, pages, designTokens, themeTokens, navigation, footer, colorPalette } = config;
  const tokens = themeTokens || designTokens;

  // Clean project name for filesystem
  const cleanProjectName = projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  console.log(`Creating project from template: ${cleanProjectName}`);

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

  // Step 3: Generate page content
  console.log('Generating page content...');
  const pageContents: Array<{ path: string; content: string }> = [];

  for (const page of pages) {
    // Use AI-generated content if available, otherwise generate from template
    const pageContent = page.generatedContent
      ? generatePageComponentFromAI(page, page.generatedContent)
      : generatePageComponent(page, tokens);

    pageContents.push({ path: page.path, content: pageContent });

    // Write page file
    const pagePath = join(projectDir, 'app', page.path === '/' ? 'page.tsx' : `${page.path.slice(1)}/page.tsx`);
    await writeFile(pagePath, pageContent);
    console.log(`✓ Generated page: ${page.path}`);
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

  // Step 4: Detect and install shadcn components
  const detectedComponents = detectShadcnComponentsFromPages(pageContents);
  const uniqueComponents = Array.from(new Set(detectedComponents)).sort();

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
    console.log('No shadcn components detected');
  }

  // Step 5: Update README with project information
  const readmeContent = `# ${projectName}

Generated with Genie.

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
