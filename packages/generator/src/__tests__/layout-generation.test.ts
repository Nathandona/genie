import { describe, it, expect } from 'vitest';
import { generateNextJSProjectFromComponents } from '../index.js';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';

describe('Layout Generation', () => {
  it('should generate layout.tsx with metadata for component-based pages', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'genie-test-'));

    try {
      const config = {
        outputDir: tempDir,
        projectName: 'Test Layout Project',
        pages: [
          {
            url: 'https://example.com',
            title: 'Test Page',
            html: '<div>Test content</div>',
            path: '/',
            summary: {
              url: 'https://example.com',
              title: 'Test Page Title',
              metaDescription: 'Test page description',
              mainHeading: 'Main Heading',
              contentPreview: 'Content preview'
            },
            componentMatches: [
              {
                componentId: 'hero-default',
                confidence: 0.9,
                contentMapping: {
                  title: 'Welcome',
                  subtitle: 'Hello world',
                  description: 'Test description'
                }
              }
            ]
          }
        ],
        designTokens: {
          colors: ['#000000', '#ffffff'],
          fonts: ['Arial'],
          spacingScale: [4, 8, 16, 24, 32]
        }
      };

      await generateNextJSProjectFromComponents(config);

      // Check that layout.tsx was created with metadata
      const layoutPath = path.join(tempDir, 'test-layout-project', 'app', 'layout.tsx');
      const layoutExists = await fs.pathExists(layoutPath);

      expect(layoutExists).toBe(true);

      if (layoutExists) {
        const layoutContent = await fs.readFile(layoutPath, 'utf-8');
        expect(layoutContent).toContain('import type { Metadata } from "next"');
        expect(layoutContent).toContain('export const metadata: Metadata');
        expect(layoutContent).toContain('title: "Test Page Title"');
        expect(layoutContent).toContain('description: "Test page description"');
      }

      // Check that page.tsx exists and is a client component
      const pagePath = path.join(tempDir, 'test-layout-project', 'app', 'page.tsx');
      const pageExists = await fs.pathExists(pagePath);

      expect(pageExists).toBe(true);

      if (pageExists) {
        const pageContent = await fs.readFile(pagePath, 'utf-8');
        expect(pageContent).toContain("'use client'");
        expect(pageContent).not.toContain('export const metadata');
        expect(pageContent).toContain('export default function Page()');
      }

    } finally {
      // Cleanup
      await fs.remove(tempDir);
    }
  });
});
