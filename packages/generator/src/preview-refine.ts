import { exec, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { existsSync } from 'node:fs';
import type { DesignTokenSummary } from '@genie/analyzer';
import type { GeminiClient } from '@genie/ai-services';

const execAsync = promisify(exec);

export interface PreviewRefineConfig {
  projectDir: string;
  projectId: string;
  pages: Array<{
    url: string;
    path: string;
    generatedContent?: string;
  }>;
  designTokens: DesignTokenSummary;
  geminiClient: GeminiClient | null;
}

export interface RefinedPage {
  path: string;
  refinedContent: string;
}

/**
 * Run pnpm install and pnpm dev, then capture preview output for refinement
 */
export async function previewAndRefine(config: PreviewRefineConfig): Promise<RefinedPage[]> {
  const { projectDir, projectId, pages, designTokens, geminiClient } = config;

  if (!geminiClient) {
    // No Gemini client, skip refinement
    return [];
  }

  // Install dependencies only if node_modules doesn't exist (already installed in generateNextJSProject)
  const nodeModulesPath = join(projectDir, 'node_modules');
  if (!existsSync(nodeModulesPath)) {
    try {
      await execAsync('pnpm install', {
        cwd: projectDir,
        timeout: 120_000, // 2 minutes
        env: {
          ...process.env,
          CI: 'true',
        },
      });
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${(error as Error).message}`);
    }
  }

  // Start dev server on a random port
  const port = 3000 + Math.floor(Math.random() * 1000);
  const devProcess = spawn('pnpm', ['dev', '--port', port.toString(), '--turbo'], {
    cwd: projectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: port.toString(),
    },
    detached: false,
  });

  let serverReady = false;
  const serverOutput: string[] = [];

  // Capture server output
  devProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    serverOutput.push(output);
    // Check if server is ready
    if (output.includes('Ready') || output.includes('Local:') || output.includes('started server')) {
      serverReady = true;
    }
  });

  devProcess.stderr?.on('data', (data) => {
    serverOutput.push(data.toString());
  });

  // Wait for server to be ready (max 60 seconds)
  const maxWaitTime = 60_000;
  const checkInterval = 1000;
  let waited = 0;

  while (!serverReady && waited < maxWaitTime) {
    await setTimeout(checkInterval);
    waited += checkInterval;
  }

  if (!serverReady) {
    devProcess.kill('SIGTERM');
    throw new Error('Dev server failed to start within timeout');
  }

  // Give it a bit more time to fully initialize
  await setTimeout(3000);

  // Fetch the homepage to analyze styling
  let previewHtml = '';
  let previewCss = '';
  
  try {
    const response = await fetch(`http://localhost:${port}`);
    if (response.ok) {
      previewHtml = await response.text();
      
      // Try to extract CSS from the HTML or fetch it separately
      // For now, we'll use the HTML content for analysis
    }
  } catch (error) {
    console.warn(`Failed to fetch preview: ${(error as Error).message}`);
  }

  // Clean up dev server
  devProcess.kill('SIGTERM');
  
  // Wait a bit for cleanup
  await setTimeout(2000);
  
  // Force kill if still running
  if (!devProcess.killed) {
    devProcess.kill('SIGKILL');
  }

  // If we couldn't fetch preview, return empty array
  if (!previewHtml) {
    return [];
  }

  // Use Gemini to refine content based on preview
  const refinedPages: RefinedPage[] = [];

  for (const page of pages) {
    if (!page.generatedContent) {
      continue; // Skip pages without generated content
    }

    try {
      // Create a refinement prompt based on the preview
      const refinementPrompt = buildRefinementPrompt({
        originalContent: page.generatedContent,
        previewHtml,
        designTokens,
        pagePath: page.path,
      });

      // Use Gemini to refine
      const refined = await geminiClient.generateContent({
        pageSummary: {
          url: page.url,
          title: undefined,
          metaDescription: undefined,
          mainHeading: undefined,
          contentPreview: undefined,
        },
        contentSlices: [],
        themeTokens: {
          colors: designTokens.colors,
          fonts: designTokens.fonts,
          spacingScale: designTokens.spacingScale,
          borderRadius: designTokens.borderRadius,
          shadows: designTokens.shadows,
          requiredComponents: designTokens.requiredComponents,
        },
        templateStructure: refinementPrompt,
        navigation: [],
      });

      refinedPages.push({
        path: page.path,
        refinedContent: refined.generatedContent,
      });
    } catch (error) {
      console.warn(`Failed to refine page ${page.path}: ${(error as Error).message}`);
      // Continue with other pages
    }
  }

  return refinedPages;
}

function buildRefinementPrompt(config: {
  originalContent: string;
  previewHtml: string;
  designTokens: DesignTokenSummary;
  pagePath: string;
}): string {
  const { originalContent, previewHtml, designTokens, pagePath } = config;

  // Extract key styling information from preview HTML
  const styleInfo = extractStyleInfo(previewHtml);

  return `Refine this Next.js 16 page component based on the actual rendered preview.

Original Component:
\`\`\`tsx
${originalContent.substring(0, 2000)}
\`\`\`

Preview HTML Analysis:
${styleInfo}

Design Tokens:
- Colors: ${designTokens.colors.join(', ') || 'Default'}
- Fonts: ${designTokens.fonts.join(', ') || 'System default'}
- Spacing: ${designTokens.spacingScale.slice(0, 10).join(', ') || 'Default'}

Page Path: ${pagePath}

Please refine the component to:
1. Match the actual styling from the preview
2. Ensure proper spacing and layout
3. Use the correct color scheme
4. Maintain semantic HTML structure
5. Keep all functionality intact

Return ONLY the refined JSX/TSX code without markdown formatting.`;
}

function extractStyleInfo(html: string): string {
  // Extract inline styles and class names from HTML
  const styleMatches = html.match(/style="([^"]+)"/g) || [];
  const classMatches = html.match(/class="([^"]+)"/g) || [];
  
  const styles = styleMatches.slice(0, 10).join('\n');
  const classes = classMatches.slice(0, 20).map(m => m.replace(/class="([^"]+)"/, '$1')).join(', ');

  return `
Detected Styles:
${styles || 'No inline styles found'}

Detected Classes:
${classes || 'No classes found'}
`;
}

