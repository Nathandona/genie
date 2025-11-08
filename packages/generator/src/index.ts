import { dirname, join } from 'node:path';
import { execSync } from 'node:child_process';

import fs from 'fs-extra';
import mustache from 'mustache';
import { z } from 'zod';

export interface DesignTokenSummary {
  colors: string[];
  fonts: string[];
  spacingScale: number[];
  borderRadius?: number[];
  shadows?: string[];
  requiredComponents?: string[]; // shadcn components needed
}

const fileConfigSchema = z.object({
  template: z.string(),
  context: z.record(z.any()).default({})
});

const generationSchema = z.object({
  outputDir: z.string(),
  files: z.record(fileConfigSchema)
});

export type GenerationConfig = z.infer<typeof generationSchema>;

export interface ProjectGenerationConfig {
  outputDir: string;
  projectName: string;
  pages: Array<{
    url: string;
    title?: string;
    html: string;
    path: string;
  }>;
  designTokens: DesignTokenSummary;
}

export const generateFromTemplates = async (config: GenerationConfig) => {
  const { outputDir, files } = generationSchema.parse(config);
  await fs.ensureDir(outputDir);

  const tasks = Object.keys(files).map(async relativePath => {
    const fileConfig = files[relativePath];
    const rendered = mustache.render(fileConfig.template, fileConfig.context);
    const destination = join(outputDir, relativePath);
    await fs.ensureDir(dirname(destination));
    await fs.writeFile(destination, rendered, 'utf8');
  });

  await Promise.all(tasks);
};

export const generateNextJSProject = async (config: ProjectGenerationConfig) => {
  const { outputDir, projectName, pages, designTokens } = config;
  await fs.ensureDir(outputDir);

  // Batch file generation: prepare all file operations
  const fileOperations: Array<{ path: string; content: string | object; isJSON?: boolean }> = [];

  // Generate package.json
  const packageJson = {
    name: projectName.toLowerCase().replace(/\s+/g, '-'),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies: {
      next: '16.0.1',
      react: '^19.2.0',
      'react-dom': '^19.2.0',
      '@radix-ui/react-slot': '^1.2.4',
      'class-variance-authority': '^0.7.1',
      clsx: '^2.1.1',
      'tailwind-merge': '^3.3.1',
      'lucide-react': '^0.552.0'
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      typescript: '^5',
      'tailwindcss': '^4',
      '@tailwindcss/postcss': '^4',
      eslint: '^9',
      'eslint-config-next': '16.0.1'
    }
  };

  fileOperations.push({ path: 'package.json', content: packageJson, isJSON: true });

  // Generate tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  };

  fileOperations.push({ path: 'tsconfig.json', content: tsconfig, isJSON: true });

  // Generate next.config.ts
  const nextConfig = `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
`;
  fileOperations.push({ path: 'next.config.ts', content: nextConfig });

  // Generate tailwind.config.ts
  const tailwindConfig = generateTailwindConfig(designTokens);
  fileOperations.push({ path: 'tailwind.config.ts', content: tailwindConfig });

  // Generate postcss.config.mjs
  const postcssConfig = `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
`;
  fileOperations.push({ path: 'postcss.config.mjs', content: postcssConfig });

  // Generate globals.css
  const globalsCss = generateGlobalsCSS(designTokens);
  fileOperations.push({ path: 'app/globals.css', content: globalsCss });

  // Generate layout.tsx
  const layout = generateLayout(projectName);
  fileOperations.push({ path: 'app/layout.tsx', content: layout });

  // Generate page components (add to batch operations)
  pages.forEach((page) => {
    const pageContent = generatePageComponent(page, designTokens);
    const pagePath = page.path === '/' ? 'app/page.tsx' : `app${page.path}/page.tsx`;
    fileOperations.push({ path: pagePath, content: pageContent });
  });

  // Generate lib/utils.ts
  const utils = `import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
  fileOperations.push({ path: 'lib/utils.ts', content: utils });

  // Generate README
  const readme = `# ${projectName}

Generated with Genie.

## Getting Started

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
`;
  fileOperations.push({ path: 'README.md', content: readme });

  // Generate .gitignore
  const gitignore = `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
  fileOperations.push({ path: '.gitignore', content: gitignore });

  // Batch write all files in parallel (optimized)
  await Promise.all(
    fileOperations.map(async ({ path, content, isJSON }) => {
      const fullPath = join(outputDir, path);
      await fs.ensureDir(dirname(fullPath));
      if (isJSON) {
        await fs.writeJSON(fullPath, content, { spaces: 2 });
      } else {
        await fs.writeFile(fullPath, content as string, 'utf8');
      }
    })
  );

  // Use shadcn CLI for faster setup (after files are written)
  try {
    // Use shadcn CLI with non-interactive flags
    execSync('pnpm dlx shadcn@latest init -y', {
      cwd: outputDir,
      stdio: 'pipe',
      timeout: 30_000,
      env: {
        ...process.env,
        // Set defaults for non-interactive mode
        FORCE_COLOR: '0'
      }
    });
  } catch (error) {
    // Fallback to manual config if CLI fails
    const componentsJson = {
      $schema: 'https://ui.shadcn.com/schema.json',
      style: 'new-york',
      rsc: true,
      tsx: true,
      tailwind: {
        config: 'tailwind.config.ts',
        css: 'app/globals.css',
        baseColor: 'neutral',
        cssVariables: true
      },
      aliases: {
        components: '@/components',
        utils: '@/lib/utils',
        ui: '@/components/ui'
      }
    };
    await fs.writeJSON(join(outputDir, 'components.json'), componentsJson, { spaces: 2 });
  }

  // Add detected shadcn components automatically
  if (designTokens.requiredComponents && designTokens.requiredComponents.length > 0) {
    // Remove duplicates and sort
    const uniqueComponents = [...new Set(designTokens.requiredComponents)].sort();
    
    // Add components one by one (shadcn CLI doesn't support multiple components in one command)
    for (const component of uniqueComponents) {
      try {
        execSync(`pnpm dlx shadcn@latest add ${component} -y`, {
          cwd: outputDir,
          stdio: 'pipe',
          timeout: 60_000, // 60 seconds per component
          env: {
            ...process.env,
            FORCE_COLOR: '0'
          }
        });
      } catch (error) {
        // Log but don't fail - some components might not exist or might already be added
        console.warn(`Failed to add shadcn component ${component}:`, error);
      }
    }
  }

  return {
    fileCount: pages.length + fileOperations.length,
    totalSize: 0 // Will be calculated when zipping
  };
};

function generateTailwindConfig(tokens: DesignTokenSummary): string {
  const colors = tokens.colors.length > 0 
    ? tokens.colors.reduce((acc: Record<string, string>, color: string, i: number) => {
        const key = i === 0 ? 'primary' : i === 1 ? 'secondary' : `color${i}`;
        acc[key] = color;
        return acc;
      }, {} as Record<string, string>)
    : { primary: '#000000', secondary: '#ffffff' };

  return `import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 2).replace(/"/g, "'")},
      fontFamily: {
        sans: ${tokens.fonts.length > 0 ? `['${tokens.fonts[0]}', 'sans-serif']` : "['system-ui', 'sans-serif']"},
      },
      spacing: {
        ...${JSON.stringify(tokens.spacingScale.slice(0, 10).reduce((acc: Record<number, string>, val: number) => { acc[val] = `${val}px`; return acc; }, {} as Record<number, string>), null, 2)}
      },
      borderRadius: {
        ...${tokens.borderRadius && tokens.borderRadius.length > 0 ? JSON.stringify(tokens.borderRadius.slice(0, 5).reduce((acc: Record<number, string>, val: number) => { acc[val] = `${val}px`; return acc; }, {} as Record<number, string>), null, 2) : '{}'}
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

function generateGlobalsCSS(tokens: DesignTokenSummary): string {
  const primaryColor = tokens.colors[0] || '#000000';
  
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: ${hexToHSL(primaryColor)};
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 0 0% 3.9%;
    --foreground: 0 0% 100%;
  }
}

body {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
}
`;
}

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function generateLayout(projectName: string): string {
  return `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Generated with Genie',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;
}

function generatePageComponent(page: { url: string; title?: string; html: string; path: string }, tokens: DesignTokenSummary): string {
  const title = page.title || 'Page';
  
  return `export default function Page() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">${title}</h1>
        <div className="prose max-w-none">
          {/* Content from ${page.url} */}
          <p>Page content will be rendered here</p>
        </div>
      </div>
    </main>
  );
}
`;
}
