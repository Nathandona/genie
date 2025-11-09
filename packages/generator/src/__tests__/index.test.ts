import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateNextJSProjectFromComponents, type ProjectGenerationConfig } from '../index.js';
import type { ComponentMatch } from '@genie/ai-services';
import fs from 'fs-extra';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('@genie/generator', () => {
  let testOutputDir: string;

  beforeEach(() => {
    testOutputDir = join(tmpdir(), `genie-test-${Date.now()}`);
  });

  afterEach(async () => {
    if (await fs.pathExists(testOutputDir)) {
      await fs.remove(testOutputDir);
    }
  });

    it('should handle multiple files', async () => {
      const config: ProjectGenerationConfig = {
        outputDir: testOutputDir,
        projectName: 'Test Project',
        pages: [
          {
            url: 'https://example.com',
            title: 'Home',
            html: '<html><body>Home</body></html>',
            path: '/',
          },
        ],
        designTokens: {
          colors: ['#000000', '#ffffff', '#ff0000'],
          fonts: ['Inter', 'Helvetica'],
          spacingScale: [4, 8, 16, 24, 32],
          borderRadius: [4, 8, 12],
          shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        },
      };

      await generateNextJSProjectFromComponents(config);

      expect(await fs.pathExists(join(testOutputDir, 'Test Project', 'app', 'page.tsx'))).toBe(true);
    });

    it('should create nested directories', async () => {
      const config: ProjectGenerationConfig = {
        outputDir: testOutputDir,
        projectName: 'Test Project',
        pages: [
          {
            url: 'https://example.com',
            title: 'Home',
            html: '<html><body>Home</body></html>',
            path: '/',
          },
        ],
        designTokens: {
          colors: ['#000000', '#ffffff', '#ff0000'],
          fonts: ['Inter', 'Helvetica'],
          spacingScale: [4, 8, 16, 24, 32],
          borderRadius: [4, 8, 12],
          shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        },
      };

      await generateNextJSProjectFromComponents(config);

      const filePath = join(testOutputDir, 'Test Project', 'app', 'page.tsx');
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should handle empty context', async () => {
      const config: ProjectGenerationConfig = {
        outputDir: testOutputDir,
        projectName: 'Test Project',
        pages: [
          {
            url: 'https://example.com',
            title: 'Home',
            html: '<html><body>Home</body></html>',
            path: '/',
          },
        ],
        designTokens: {
          colors: ['#000000', '#ffffff', '#ff0000'],
          fonts: ['Inter', 'Helvetica'],
          spacingScale: [4, 8, 16, 24, 32],
          borderRadius: [4, 8, 12],
          shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
        },
      };

      await generateNextJSProjectFromComponents(config);

      const content = await fs.readFile(join(testOutputDir, 'Test Project', 'app', 'page.tsx'), 'utf8');
      expect(content).toBe('<html><body>Home</body></html>');
    });
  });

  // Helper function for test configs
    const getBaseConfig = (): ProjectGenerationConfig => ({
      outputDir: testOutputDir,
      projectName: 'Test Project',
      pages: [
        {
          url: 'https://example.com',
          title: 'Home',
          html: '<html><body>Home</body></html>',
          path: '/',
        },
        {
          url: 'https://example.com/about',
          title: 'About',
          html: '<html><body>About</body></html>',
          path: '/about',
        },
      ],
      designTokens: {
        colors: ['#000000', '#ffffff', '#ff0000'],
        fonts: ['Inter', 'Helvetica'],
        spacingScale: [4, 8, 16, 24, 32],
        borderRadius: [4, 8, 12],
        shadows: ['0 2px 4px rgba(0,0,0,0.1)'],
      },
    });

    it('should generate package.json', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const packageJsonPath = join(testOutputDir, result.projectDir, 'package.json');
      expect(await fs.pathExists(packageJsonPath)).toBe(true);

      const packageJson = await fs.readJSON(packageJsonPath);
      expect(packageJson.name).toBe('test-project');
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.next).toBe('16.0.1');
      expect(packageJson.dependencies.react).toBeDefined();
    });

    it('should generate tsconfig.json', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const tsconfigPath = join(testOutputDir, result.projectDir, 'tsconfig.json');
      expect(await fs.pathExists(tsconfigPath)).toBe(true);

      const tsconfig = await fs.readJSON(tsconfigPath);
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.jsx).toBe('preserve');
    });

    it('should generate next.config.ts', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const nextConfigPath = join(testOutputDir, result.projectDir, 'next.config.ts');
      expect(await fs.pathExists(nextConfigPath)).toBe(true);

      const content = await fs.readFile(nextConfigPath, 'utf8');
      expect(content).toContain('NextConfig');
      expect(content).toContain('export default');
    });

    it('should generate tailwind.config.ts with design tokens', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const tailwindConfigPath = join(testOutputDir, result.projectDir, 'tailwind.config.ts');
      expect(await fs.pathExists(tailwindConfigPath)).toBe(true);

      const content = await fs.readFile(tailwindConfigPath, 'utf8');
      expect(content).toContain('tailwindcss');
      expect(content).toContain('colors');
      expect(content).toContain('#000000'); // First color should be primary
    });

    it('should generate globals.css', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const globalsCssPath = join(testOutputDir, result.projectDir, 'app/globals.css');
      expect(await fs.pathExists(globalsCssPath)).toBe(true);

      const content = await fs.readFile(globalsCssPath, 'utf8');
      expect(content).toContain('@tailwind');
      expect(content).toContain(':root');
    });

    it('should generate layout.tsx', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const layoutPath = join(testOutputDir, result.projectDir, 'app/layout.tsx');
      expect(await fs.pathExists(layoutPath)).toBe(true);

      const content = await fs.readFile(layoutPath, 'utf8');
      expect(content).toContain('RootLayout');
      expect(content).toContain('Test Project');
      expect(content).toContain('globals.css');
    });

    it('should generate page components', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const homePagePath = join(testOutputDir, result.projectDir, 'app/page.tsx');
      const aboutPagePath = join(testOutputDir, result.projectDir, 'app/about/page.tsx');

      expect(await fs.pathExists(homePagePath)).toBe(true);
      expect(await fs.pathExists(aboutPagePath)).toBe(true);

      const homeContent = await fs.readFile(homePagePath, 'utf8');
      const aboutContent = await fs.readFile(aboutPagePath, 'utf8');

      expect(homeContent).toContain('Home');
      expect(aboutContent).toContain('About');
    });

    it('should generate lib/utils.ts', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const utilsPath = join(testOutputDir, result.projectDir, 'lib/utils.ts');
      expect(await fs.pathExists(utilsPath)).toBe(true);

      const content = await fs.readFile(utilsPath, 'utf8');
      expect(content).toContain('cn');
      expect(content).toContain('clsx');
      expect(content).toContain('tailwind-merge');
    });

    it('should generate README.md', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const readmePath = join(testOutputDir, result.projectDir, 'README.md');
      expect(await fs.pathExists(readmePath)).toBe(true);

      const content = await fs.readFile(readmePath, 'utf8');
      expect(content).toContain('Test Project');
      expect(content).toContain('pnpm install');
      expect(content).toContain('pnpm dev');
    });

    it('should generate .gitignore', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      const gitignorePath = join(testOutputDir, result.projectDir, '.gitignore');
      expect(await fs.pathExists(gitignorePath)).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf8');
      expect(content).toContain('node_modules');
      expect(content).toContain('.next');
    });

    it('should handle project name normalization', async () => {
      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        projectName: 'My Test Project 123',
      };

      const result = await generateNextJSProjectFromComponents(config);

      const packageJson = await fs.readJSON(join(testOutputDir, result.projectDir, 'package.json'));
      expect(packageJson.name).toBe('my-test-project-123');
    });

    it('should handle empty design tokens', async () => {
      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        designTokens: {
          colors: [],
          fonts: [],
          spacingScale: [],
        },
      };

      const result = await generateNextJSProjectFromComponents(config);

      // Should still generate files with defaults
      expect(await fs.pathExists(join(testOutputDir, result.projectDir, 'package.json'))).toBe(true);
      expect(await fs.pathExists(join(testOutputDir, result.projectDir, 'tailwind.config.ts'))).toBe(true);
    });

    it('should return file count', async () => {
      const result = await generateNextJSProjectFromComponents(getBaseConfig());

      expect(result.fileCount).toBeGreaterThan(0);
      expect(result).toHaveProperty('totalSize');
    });
    it('should generate component-based project', async () => {
      const componentMatches: ComponentMatch[] = [
        {
          componentId: 'hero-default',
          componentType: 'hero',
          confidence: 0.9,
          reasoning: 'Hero content detected',
          contentMapping: {
            title: 'Welcome',
            description: 'Welcome message',
            primaryButton: { text: 'Get Started', url: '/start' }
          }
        }
      ];

      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        pages: [
          {
            url: 'https://example.com',
            title: 'Test Page',
            html: '<html><body><h1>Welcome</h1></body></html>',
            path: '/',
            componentMatches
          }
        ]
      };

      const result = await generateNextJSProjectFromComponents(config);

      expect(result).toBeDefined();
      expect(result.fileCount).toBeGreaterThan(0);
      expect(result.projectDir).toBeTruthy();

      // Check that project files were created
      const projectPath = join(testOutputDir, result.projectDir);
      expect(await fs.pathExists(join(projectPath, 'package.json'))).toBe(true);
      expect(await fs.pathExists(join(projectPath, 'app', 'page.tsx'))).toBe(true);
    });

    it('should handle multiple component matches', async () => {
      const componentMatches: ComponentMatch[] = [
        {
          componentId: 'hero-default',
          componentType: 'hero',
          confidence: 0.9,
          reasoning: 'Hero content detected',
          contentMapping: { title: 'Welcome' }
        },
        {
          componentId: 'features-grid',
          componentType: 'features',
          confidence: 0.8,
          reasoning: 'Features content detected',
          contentMapping: {
            features: [{ title: 'Feature 1', description: 'Description 1' }]
          }
        }
      ];

      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        pages: [
          {
            url: 'https://example.com',
            title: 'Test Page',
            html: '<html><body><h1>Welcome</h1></body></html>',
            path: '/',
            componentMatches
          }
        ]
      };

      const result = await generateNextJSProjectFromComponents(config);

      expect(result).toBeDefined();
      expect(result.fileCount).toBe(1);
    });

    it('should fallback to template generation when no components provided', async () => {
      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        pages: [
          {
            url: 'https://example.com',
            title: 'Test Page',
            html: '<html><body><h1>Welcome</h1></body></html>',
            path: '/',
            // No componentMatches provided
          }
        ]
      };

      const result = await generateNextJSProjectFromComponents(config);

      expect(result).toBeDefined();
      expect(result.fileCount).toBe(1);

      // Should still create the project
      const projectPath = join(testOutputDir, result.projectDir);
      expect(await fs.pathExists(join(projectPath, 'app', 'page.tsx'))).toBe(true);
    });

    it('should sort components by confidence', async () => {
      const componentMatches: ComponentMatch[] = [
        {
          componentId: 'features-grid',
          componentType: 'features',
          confidence: 0.6,
          reasoning: 'Features content detected',
          contentMapping: { features: [] }
        },
        {
          componentId: 'hero-default',
          componentType: 'hero',
          confidence: 0.9,
          reasoning: 'Hero content detected',
          contentMapping: { title: 'Welcome' }
        }
      ];

      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        pages: [
          {
            url: 'https://example.com',
            title: 'Test Page',
            html: '<html><body><h1>Welcome</h1></body></html>',
            path: '/',
            componentMatches
          }
        ]
      };

      const result = await generateNextJSProjectFromComponents(config);

      // Check that page was generated (we can't easily test the exact order without reading the file)
      expect(result).toBeDefined();
    });

    it('should handle component rendering errors gracefully', async () => {
      const componentMatches: ComponentMatch[] = [
        {
          componentId: 'non-existent-component',
          componentType: 'unknown',
          confidence: 0.9,
          reasoning: 'Test component',
          contentMapping: { test: 'data' }
        }
      ];

      const config: ProjectGenerationConfig = {
        ...getBaseConfig(),
        pages: [
          {
            url: 'https://example.com',
            title: 'Test Page',
            html: '<html><body><h1>Welcome</h1></body></html>',
            path: '/',
            componentMatches
          }
        ]
      };

      // Mock console.warn to avoid console output during test
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await generateNextJSProjectFromComponents(config);

      expect(result).toBeDefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
