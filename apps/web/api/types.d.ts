// Type declarations for API server imports
// These are excluded from type checking since they're in a separate package
// This imports from apps/api (the actual API server), not from apps/web/api

declare module '../../api/dist/server.js' {
  export function createServer(): Promise<any>;
}

declare module '@prisma/client' {
  export const PrismaClient: any;
  export const Prisma: any;
  export type User = any;
  export type Project = any;
  export type Page = any;
  export type Asset = any;
  export type Generation = any;
  export type Usage = any;
  export type ApiKey = any;
}

