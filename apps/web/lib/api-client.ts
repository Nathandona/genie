/**
 * API client for Genie backend
 */

import { getAuthToken, setAuthToken as saveAuthToken, clearAuthToken } from './auth';
import { DEV_UTILS } from './dev-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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
  htmlSnapshot: string | null;
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

    // Handle 204 No Content (empty response body)
    if (response.status === 204) {
      return undefined as T;
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return undefined as T;
    }

    // Try to parse JSON, but handle empty responses gracefully
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return undefined as T;
    }

    try {
      return JSON.parse(text) as T;
    } catch (err) {
      // If JSON parsing fails, return undefined for void responses
      return undefined as T;
    }
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

  async deleteProject(id: string): Promise<void> {
    return this.request<void>(`/projects/${id}`, {
      method: 'DELETE',
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

  async downloadProject(projectId: string): Promise<Blob> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Use the /file endpoint to get the actual ZIP file
    const response = await fetch(`${this.baseUrl}/projects/${projectId}/download/file`, {
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(error.message || 'Download failed');
    }

    return response.blob();
  }

  // Progress tracking (polls project status with CrawlJob data)
  async getProjectStatus(projectId: string): Promise<{
    project: Project;
    crawlJob: CrawlJob | null;
    stats: {
      pagesDiscovered: number;
      componentsCreated: number;
      assetsOptimized: number;
    };
  }> {
    return this.request(`/projects/${projectId}/progress`);
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

  // Polar.sh Payments
  async getPolarProducts(): Promise<any[]> {
    const response = await this.request<{ products: any[] }>('/polar/products');
    return response.products || [];
  }

  async createPolarCheckout(priceId: string, successUrl?: string): Promise<{ checkoutUrl: string; checkoutId: string }> {
    return this.request<{ checkoutUrl: string; checkoutId: string }>('/polar/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId, successUrl }),
    });
  }

  async getPolarSubscriptions(): Promise<any[]> {
    const response = await this.request<{ subscriptions: any[] }>('/polar/subscriptions');
    return response.subscriptions || [];
  }

  async cancelPolarSubscription(subscriptionId: string): Promise<boolean> {
    const response = await this.request<{ success: boolean }>(`/polar/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
    return response.success;
  }

  async getPolarPortalUrl(): Promise<string> {
    const response = await this.request<{ url: string }>('/polar/portal');
    return response.url;
  }

  // Preview
  async startPreview(projectId: string): Promise<{ url: string; port: number }> {
    return this.request<{ url: string; port: number }>(`/projects/${projectId}/preview/start`, {
      method: 'POST',
    });
  }

  async stopPreview(projectId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/projects/${projectId}/preview/stop`, {
      method: 'POST',
    });
  }

  async getPreviewStatus(projectId: string): Promise<{ url: string; port: number; startedAt: string } | null> {
    return this.request<{ url: string; port: number; startedAt: string } | null>(`/projects/${projectId}/preview`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
