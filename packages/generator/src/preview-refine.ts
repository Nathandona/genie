import { exec, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { existsSync } from 'node:fs';
import type { DesignTokenSummary } from '@genie/analyzer';

const execAsync = promisify(exec);

export interface PreviewRefineConfig {
  projectDir: string;
  projectId: string;
  pages: Array<{
    url: string;
    path: string;
  }>;
  designTokens: DesignTokenSummary;
}

export interface RefinedPage {
  path: string;
  refinedContent: string;
}

/**
 * Run pnpm install and pnpm dev, then capture preview output for refinement
 */
export async function previewAndRefine(config: PreviewRefineConfig): Promise<RefinedPage[]> {
  const { projectDir, projectId, pages, designTokens } = config;

  // AI refinement disabled - return empty results
  return [];
}
