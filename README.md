# Genie Monorepo

This repository houses the Genie platform as a Turborepo workspace. It follows the architecture and roadmap described in `.notes/`.

## Workspaces

- `apps/web` – Next.js dashboard scaffold
- `apps/api` – Fastify API service skeleton
- `packages/shared` – Shared TypeScript types
- `packages/crawler` – Puppeteer-powered crawling engine
- `packages/analyzer` – CSS and design token analysis helpers
- `packages/generator` – Project generation utilities
- `packages/ai-services` – OpenAI and Anthropic client wrappers

## Getting Started

```bash
pnpm install
pnpm dev
```

Use `pnpm --filter <workspace>` to run commands for specific packages.
