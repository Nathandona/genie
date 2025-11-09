# Genie Monorepo

This repository houses the Genie platform as a Turborepo workspace. It follows the architecture and roadmap described in `.notes/`.

## Workspaces

- `apps/web` – Next.js dashboard scaffold
- `apps/api` – Fastify API service skeleton
- `packages/shared` – Shared TypeScript types
- `packages/crawler` – Puppeteer-powered crawling engine with navigation extraction
- `packages/analyzer` – CSS and design token analysis helpers with content slice extraction
- `packages/generator` – Project generation utilities with Gemini integration
- `packages/ai-services` – OpenAI, Anthropic, and Google Gemini client wrappers

## Enhanced Workflow

Genie uses Google Gemini to generate and refine content for websites:

1. **Crawler** extracts pages, navigation structure, and page summaries
2. **Analyzer** extracts design tokens (colors, fonts, spacing) and content slices
3. **Google Gemini** generates Next.js 16 page components using shadcn/ui based on extracted content
4. **Generator** creates a complete Next.js 16 project with:
   - Theme tokens applied to `globals.css`
   - AI-generated page components
   - Navigation components
   - Required shadcn/ui components
5. **Preview & Refine** (if Gemini API key is set):
   - Runs `pnpm install` and `pnpm dev` to start the generated app
   - Captures the rendered preview HTML/CSS
   - Uses Gemini to analyze the actual styling and refine content
   - Updates page components with refined content before packaging

## Environment Variables

Add the following to your `.env` file in `apps/api`:

```bash
# Required
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=your-secret-key-min-32-chars
POLAR_ACCESS_TOKEN=your-polar-token

# Optional - for AI content generation
GEMINI_API_KEY=your-gemini-api-key  # Get from https://aistudio.google.com/api-keys
OPENAI_API_KEY=your-openai-key  # Optional
ANTHROPIC_API_KEY=your-anthropic-key  # Optional
```

## Getting Started

```bash
pnpm install
pnpm dev
```

Use `pnpm --filter <workspace>` to run commands for specific packages.

## Gemini Integration

The platform uses Google Gemini for content generation and refinement. If `GEMINI_API_KEY` is not set, the generator will create pages with placeholder content. With the API key:

### Initial Generation
Gemini generates production-ready JSX/TSX code based on:
- Extracted content slices from the original website
- Theme tokens (colors, fonts, spacing)
- Navigation structure
- Detected shadcn/ui components

### Preview & Refinement
After generating the project, Genie automatically:
1. Installs dependencies (`pnpm install`)
2. Starts the dev server (`pnpm dev`)
3. Captures the rendered preview HTML/CSS
4. Uses Gemini to analyze the actual styling and refine content
5. Updates page components with refined content
6. Packages the final project for download

This ensures the generated code matches the intended design and styling.

See [Google AI Studio](https://aistudio.google.com/api-keys) for API key setup.

## Code Quality

The codebase has been audited and cleaned:
- Removed duplicate `DesignTokenSummary` interface (now imported from `@genie/analyzer`)
- All packages properly export types with correct `package.json` exports configuration
- No placeholder or fake data in production code (only in test files where appropriate)
