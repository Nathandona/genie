/**
 * API client for Genie backend
 */

import { getAuthToken, setAuthToken as saveAuthToken, clearAuthToken } from './auth';
import { DEV_UTILS } from './dev-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Project {
  id: string;
  sourceUrl: string;
  status: 'queued' | 'crawling' | 'analyzing' | 'generating' | 'completed' | 'failed';
  pageCount: number;
  generationTime: number | null;
  settings: {
    maxPages: number;
    includePatterns?: string[];
    excludePatterns?: string[];
  };
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Page {
  id: string;
  url: string;
  title: string | null;
  metaDescription: string | null;
  createdAt: string;
}

export interface CrawlJob {
  id: string;
  projectId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentPage: string | null;
  pagesDiscovered: number;
  errors: any[];
  startedAt: string | null;
  completedAt: string | null;
}

export interface DownloadInfo {
  download: string;
  fileCount: number;
  totalSize: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    saveAuthToken(token);
  }

  clearToken() {
    clearAuthToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    // Log in development
    DEV_UTILS.logApiCall(options.method || 'GET', url, options.body);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string): Promise<Project> {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: {
    sourceUrl: string;
    settings?: {
      maxPages?: number;
      includePatterns?: string[];
      excludePatterns?: string[];
    };
  }): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Pages
  async getProjectPages(projectId: string): Promise<Page[]> {
    return this.request<Page[]>(`/projects/${projectId}/pages`);
  }

  // Download
  async getDownloadInfo(projectId: string): Promise<DownloadInfo> {
    return this.request<DownloadInfo>(`/projects/${projectId}/download`);
  }

  // Progress tracking (polls project status)
  async getProjectStatus(projectId: string): Promise<{
    project: Project;
    stats: {
      pagesDiscovered: number;
      componentsCreated: number;
      assetsOptimized: number;
    };
  }> {
    const project = await this.getProject(projectId);
    const pages = await this.getProjectPages(projectId).catch(() => []);
    
    return {
      project,
      stats: {
        pagesDiscovered: pages.length,
        componentsCreated: pages.length * 3, // Estimate
        assetsOptimized: pages.length * 5, // Estimate
      },
    };
  }

  // Authentication
  async login(email: string, password: string): Promise<{ token: string }> {
    const result = await this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(result.token);
    return result;
  }

  async register(email: string, password: string, name?: string): Promise<{ token: string }> {
    const result = await this.request<{ token: string }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(result.token);
    return result;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
