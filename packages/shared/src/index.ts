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

// New component-based types
export interface ComponentMatch {
  componentId: string;
  componentType: string;
  confidence: number; // 0-1 score
  reasoning: string;
  contentMapping: Record<string, unknown>; // How semantic content maps to component props
}

export interface ComponentSelectionResult {
  matches: ComponentMatch[];
  metadata?: Record<string, unknown>;
}

export interface SemanticContent {
  hero?: {
    title?: string;
    subtitle?: string;
    description?: string;
    primaryButton?: { text: string; url?: string };
    secondaryButton?: { text: string; url?: string };
    backgroundImage?: string;
    backgroundVideo?: string;
  };
  features?: {
    title?: string;
    subtitle?: string;
    features: Array<{
      title?: string;
      description?: string;
      icon?: string;
      image?: string;
    }>;
  };
  pricing?: {
    title?: string;
    subtitle?: string;
    plans: Array<{
      name?: string;
      price?: string;
      period?: string;
      description?: string;
      features: string[];
      button?: { text: string; url?: string; highlighted?: boolean };
      popular?: boolean;
    }>;
  };
  testimonials?: {
    title?: string;
    subtitle?: string;
    testimonials: Array<{
      name?: string;
      role?: string;
      company?: string;
      content?: string;
      avatar?: string;
      rating?: number;
    }>;
  };
  navigation?: any; // Placeholder for future expansion
  footer?: any; // Placeholder for future expansion
  contact?: any; // Placeholder for future expansion
  about?: any; // Placeholder for future expansion
  stats?: any; // Placeholder for future expansion
}

export interface ComponentRegistryInfo {
  availableComponents: Array<{
    id: string;
    type: string;
    name: string;
    description: string;
    schema: Record<string, unknown>; // Zod schema info
  }>;
}

export interface ComponentSelectionRequest {
  semanticContent: Record<string, unknown>; // Extracted semantic content from analyzer
  componentRegistry: ComponentRegistryInfo; // Available components
  context?: {
    pageSummary?: PageSummary;
    themeTokens?: ThemeTokens;
  };
}

// Updated pipeline phases
export const PIPELINE_PHASES = [
  'extraction',      // Crawling and extracting content
  'analysis',        // Semantic content analysis
  'selection',       // Component selection and matching
  'generation',      // Component-based code generation
  'finalization'     // ZIP creation and cleanup
] as const;

export type PipelinePhase = (typeof PIPELINE_PHASES)[number];

export interface PipelineProgress {
  projectId: string;
  phase: PipelinePhase;
  progress: number; // 0-100
  currentStep?: string;
  errors?: string[];
}

// Enhanced analysis result
export interface AnalysisResult {
  designTokens: ThemeTokens;
  contentSlices: ContentSlice[];
  semanticContent: SemanticContent;
  colorPalette?: any; // From analyzer
}
