import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateFromTemplates, generateNextJSProject, type GenerationConfig, type ProjectGenerationConfig } from '../index.js';
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

  describe('generateFromTemplates', () => {
    it('should validate generation config', () => {
      const config: GenerationConfig = {
        outputDir: testOutputDir,
        files: {
          'test.txt': {
            template: 'Hello {{name}}!',
            context: { name: 'World' },
          },
        },
      };

      expect(config.outputDir).toBeTruthy();
      expect(config.files).toBeDefined();
      expect(Object.keys(config.files).length).toBeGreaterThan(0);
    });

    it('should render templates with Mustache', async () => {
      const config: GenerationConfig = {
        outputDir: testOutputDir,
        files: {
          'greeting.txt': {
            template: 'Hello {{name}}!',
            context: { name: 'World' },
          },
        },
      };

      await generateFromTemplates(config);

      const filePath = join(testOutputDir, 'greeting.txt');
      expect(await fs.pathExists(filePath)).toBe(true);
      
      const content = await fs.readFile(filePath, 'utf8');
      expect(content).toBe('Hello World!');
    });

    it('should handle multiple files', async () => {
      const config: GenerationConfig = {
        outputDir: testOutputDir,
        files: {
          'file1.txt': {
            template: 'File 1: {{value}}',
            context: { value: 'one' },
          },
          'file2.txt': {
            template: 'File 2: {{value}}',
            context: { value: 'two' },
          },
          'nested/path/file3.txt': {
            template: 'File 3: {{value}}',
            context: { value: 'three' },
          },
        },
      };

      await generateFromTemplates(config);

      expect(await fs.pathExists(join(testOutputDir, 'file1.txt'))).toBe(true);
      expect(await fs.pathExists(join(testOutputDir, 'file2.txt'))).toBe(true);
      expect(await fs.pathExists(join(testOutputDir, 'nested/path/file3.txt'))).toBe(true);

      const content1 = await fs.readFile(join(testOutputDir, 'file1.txt'), 'utf8');
      const content2 = await fs.readFile(join(testOutputDir, 'file2.txt'), 'utf8');
      const content3 = await fs.readFile(join(testOutputDir, 'nested/path/file3.txt'), 'utf8');

      expect(content1).toBe('File 1: one');
      expect(content2).toBe('File 2: two');
      expect(content3).toBe('File 3: three');
    });

    it('should create nested directories', async () => {
      const config: GenerationConfig = {
        outputDir: testOutputDir,
        files: {
          'deep/nested/path/file.txt': {
            template: 'Content',
            context: {},
          },
        },
      };

      await generateFromTemplates(config);

      const filePath = join(testOutputDir, 'deep/nested/path/file.txt');
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it('should handle empty context', async () => {
      const config: GenerationConfig = {
        outputDir: testOutputDir,
        files: {
          'static.txt': {
            template: 'Static content',
            context: {},
          },
        },
      };

      await generateFromTemplates(config);

      const content = await fs.readFile(join(testOutputDir, 'static.txt'), 'utf8');
      expect(content).toBe('Static content');
    });
  });

  describe('generateNextJSProject', () => {
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
      await generateNextJSProject(getBaseConfig());

      const packageJsonPath = join(testOutputDir, 'package.json');
      expect(await fs.pathExists(packageJsonPath)).toBe(true);

      const packageJson = await fs.readJSON(packageJsonPath);
      expect(packageJson.name).toBe('test-project');
      expect(packageJson.dependencies).toBeDefined();
      expect(packageJson.dependencies.next).toBe('16.0.1');
      expect(packageJson.dependencies.react).toBeDefined();
    });

    it('should generate tsconfig.json', async () => {
      await generateNextJSProject(getBaseConfig());

      const tsconfigPath = join(testOutputDir, 'tsconfig.json');
      expect(await fs.pathExists(tsconfigPath)).toBe(true);

      const tsconfig = await fs.readJSON(tsconfigPath);
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.jsx).toBe('preserve');
    });

    it('should generate next.config.ts', async () => {
      await generateNextJSProject(getBaseConfig());

      const nextConfigPath = join(testOutputDir, 'next.config.ts');
      expect(await fs.pathExists(nextConfigPath)).toBe(true);

      const content = await fs.readFile(nextConfigPath, 'utf8');
      expect(content).toContain('NextConfig');
      expect(content).toContain('export default');
    });

    it('should generate tailwind.config.ts with design tokens', async () => {
      await generateNextJSProject(getBaseConfig());

      const tailwindConfigPath = join(testOutputDir, 'tailwind.config.ts');
      expect(await fs.pathExists(tailwindConfigPath)).toBe(true);

      const content = await fs.readFile(tailwindConfigPath, 'utf8');
      expect(content).toContain('tailwindcss');
      expect(content).toContain('colors');
      expect(content).toContain('#000000'); // First color should be primary
    });

    it('should generate globals.css', async () => {
      await generateNextJSProject(getBaseConfig());

      const globalsCssPath = join(testOutputDir, 'app/globals.css');
      expect(await fs.pathExists(globalsCssPath)).toBe(true);

      const content = await fs.readFile(globalsCssPath, 'utf8');
      expect(content).toContain('@tailwind');
      expect(content).toContain(':root');
    });

    it('should generate layout.tsx', async () => {
      await generateNextJSProject(getBaseConfig());

      const layoutPath = join(testOutputDir, 'app/layout.tsx');
      expect(await fs.pathExists(layoutPath)).toBe(true);

      const content = await fs.readFile(layoutPath, 'utf8');
      expect(content).toContain('RootLayout');
      expect(content).toContain('Test Project');
      expect(content).toContain('globals.css');
    });

    it('should generate page components', async () => {
      await generateNextJSProject(getBaseConfig());

      const homePagePath = join(testOutputDir, 'app/page.tsx');
      const aboutPagePath = join(testOutputDir, 'app/about/page.tsx');

      expect(await fs.pathExists(homePagePath)).toBe(true);
      expect(await fs.pathExists(aboutPagePath)).toBe(true);

      const homeContent = await fs.readFile(homePagePath, 'utf8');
      const aboutContent = await fs.readFile(aboutPagePath, 'utf8');

      expect(homeContent).toContain('Home');
      expect(aboutContent).toContain('About');
    });

    it('should generate lib/utils.ts', async () => {
      await generateNextJSProject(getBaseConfig());

      const utilsPath = join(testOutputDir, 'lib/utils.ts');
      expect(await fs.pathExists(utilsPath)).toBe(true);

      const content = await fs.readFile(utilsPath, 'utf8');
      expect(content).toContain('cn');
      expect(content).toContain('clsx');
      expect(content).toContain('tailwind-merge');
    });

    it('should generate README.md', async () => {
      await generateNextJSProject(getBaseConfig());

      const readmePath = join(testOutputDir, 'README.md');
      expect(await fs.pathExists(readmePath)).toBe(true);

      const content = await fs.readFile(readmePath, 'utf8');
      expect(content).toContain('Test Project');
      expect(content).toContain('pnpm install');
      expect(content).toContain('pnpm dev');
    });

    it('should generate .gitignore', async () => {
      await generateNextJSProject(getBaseConfig());

      const gitignorePath = join(testOutputDir, '.gitignore');
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

      await generateNextJSProject(config);

      const packageJson = await fs.readJSON(join(testOutputDir, 'package.json'));
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

      await generateNextJSProject(config);

      // Should still generate files with defaults
      expect(await fs.pathExists(join(testOutputDir, 'package.json'))).toBe(true);
      expect(await fs.pathExists(join(testOutputDir, 'tailwind.config.ts'))).toBe(true);
    });

    it('should return file count', async () => {
      const result = await generateNextJSProject(getBaseConfig());

      expect(result.fileCount).toBeGreaterThan(0);
      expect(result).toHaveProperty('totalSize');
    });
  });
});

