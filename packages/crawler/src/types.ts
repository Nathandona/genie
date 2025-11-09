import type { ProjectSettings, NavigationLink, PageSummary, CSSData } from '@genie/shared';

export type CrawlOptions = {
  projectId: string;
  startUrl: string;
  settings: ProjectSettings;
  maxConcurrency?: number;
  waitStrategy?: 'domcontentloaded' | 'networkidle0' | 'networkidle2' | 'load';
  onProgress?: (progress: {
    currentPage: string;
    pagesDiscovered: number;
    progress: number;
  }) => void;
};

export interface CrawlResult {
  pages: Array<{
    url: string;
    html: string;
    title?: string;
    metaDescription?: string;
    navigation?: NavigationLink[];
    summary?: PageSummary;
    css?: CSSData;
  }>;
  navigation: NavigationLink[];
  errors: string[];
}
