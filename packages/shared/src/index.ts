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

export interface NavigationLink {
  url: string;
  text: string;
  order?: number;
}

export interface PageSummary {
  url: string;
  title?: string;
  metaDescription?: string;
  mainHeading?: string;
  contentPreview?: string;
  wordCount?: number;
}

export interface ContentSlice {
  type: 'heading' | 'paragraph' | 'list' | 'quote' | 'code' | 'image' | 'button' | 'link';
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ThemeTokens {
  colors: string[];
  fonts: string[];
  spacingScale: number[];
  borderRadius?: number[];
  shadows?: string[];
  requiredComponents?: string[];
}
