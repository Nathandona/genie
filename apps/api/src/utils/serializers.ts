import type {
  ApiKey,
  Asset,
  Generation,
  Page,
  Project,
  Usage,
  User
} from '@prisma/client';

export const serializeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  role: user.role,
  subscription: user.subscription,
  stripeCustomerId: user.stripeCustomerId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const serializeProject = (project: Project) => ({
  id: project.id,
  userId: project.userId,
  sourceUrl: project.sourceUrl,
  status: project.status,
  pageCount: project.pageCount,
  generationTime: project.generationTime,
  settings: project.settings,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
  completedAt: project.completedAt
});

export const serializePage = (page: Page) => ({
  id: page.id,
  projectId: page.projectId,
  url: page.url,
  title: page.title,
  metaDescription: page.metaDescription,
  htmlSnapshot: page.htmlSnapshot,
  sections: page.sections,
  designTokens: page.designTokens,
  createdAt: page.createdAt
});

export const serializeAsset = (asset: Asset) => ({
  id: asset.id,
  projectId: asset.projectId,
  type: asset.type,
  originalUrl: asset.originalUrl,
  s3Path: asset.s3Path,
  optimizedSizes: asset.optimizedSizes,
  metadata: asset.metadata,
  createdAt: asset.createdAt
});

export const serializeGeneration = (generation: Generation) => ({
  id: generation.id,
  projectId: generation.projectId,
  version: generation.version,
  s3ZipPath: generation.s3ZipPath,
  fileCount: generation.fileCount,
  totalSize: generation.totalSize,
  downloadCount: generation.downloadCount,
  createdAt: generation.createdAt
});

export const serializeUsage = (usage: Usage) => ({
  id: usage.id,
  userId: usage.userId,
  period: usage.period,
  generationsCount: usage.generationsCount,
  pagesProcessed: usage.pagesProcessed,
  apiCallsCount: usage.apiCallsCount,
  createdAt: usage.createdAt
});

export const serializeApiKey = (apiKey: ApiKey) => ({
  id: apiKey.id,
  userId: apiKey.userId,
  name: apiKey.name,
  rateLimit: apiKey.rateLimit,
  createdAt: apiKey.createdAt,
  lastUsedAt: apiKey.lastUsedAt,
  expiresAt: apiKey.expiresAt
});
