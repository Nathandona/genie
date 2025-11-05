/**
 * Shared type definitions for Genie services.
 */

export const PROJECT_STATUSES = [
  'queued',
  'crawling',
  'analyzing',
  'generating',
  'completed',
  'failed'
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export interface ProjectSettings {
  maxPages: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  authentication?: {
    username: string;
    password: string;
  };
}

export interface CrawlProgress {
  projectId: string;
  status: ProjectStatus;
  progress: number;
  currentPage?: string;
  pagesDiscovered: number;
  errors: string[];
}
