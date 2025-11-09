import { describe, it, expect } from 'vitest';
import { extractAllColors, generateCSSVariables, generateGlobalsCSS } from '@genie/analyzer';
import { generateNextJSProject } from '../core/project-generator.js';
import fs from 'fs-extra';
import { join } from 'node:path';

describe('End-to-End: Color Extraction to Project Generation', () => {
  it('should extract colors from a real website HTML and generate a complete project', async () => {
    // Simulate HTML from a real website with various color schemes
    const mockWebsiteHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sample Company Website</title>
          <style>
            :root {
              --primary-color: #2563eb;
              --secondary-color: #64748b;
              --accent-color: #f59e0b;
              --background: #ffffff;
              --text: #1f2937;
            }

            body {
              font-family: 'Inter', sans-serif;
              background-color: var(--background);
              color: var(--text);
              margin: 0;
              padding: 0;
            }

            .hero {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 100px 20px;
              text-align: center;
            }

            .btn-primary {
              background-color: var(--primary-color);
              color: white;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              display: inline-block;
              transition: background-color 0.3s ease;
            }

            .btn-primary:hover {
              background-color: #1d4ed8;
            }

            .card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 24px;
              margin: 16px 0;
              box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }

            .text-muted {
              color: #6b7280;
            }

            .navbar {
              background: rgba(255, 255, 255, 0.95);
              backdrop-filter: blur(10px);
              border-bottom: 1px solid #e5e7eb;
              padding: 16px 0;
            }

            .footer {
              background: #1f2937;
              color: #9ca3af;
              padding: 40px 0;
              text-align: center;
            }

            .social-links a {
              color: #6b7280;
              margin: 0 8px;
              transition: color 0.3s ease;
            }

            .social-links a:hover {
              color: var(--primary-color);
            }
          </style>
        </head>
        <body>
          <nav class="navbar">
            <div class="container mx-auto px-4">
              <div class="flex justify-between items-center">
                <div class="text-xl font-bold text-gray-900">Company</div>
                <div class="space-x-6">
                  <a href="#home" class="text-gray-700 hover:text-blue-600">Home</a>
                  <a href="#about" class="text-gray-700 hover:text-blue-600">About</a>
                  <a href="#services" class="text-gray-700 hover:text-blue-600">Services</a>
                  <a href="#contact" class="text-gray-700 hover:text-blue-600">Contact</a>
                </div>
              </div>
            </div>
          </nav>

          <section class="hero">
            <div class="container mx-auto px-4">
              <h1 class="text-4xl md:text-6xl font-bold mb-6">Welcome to Our Platform</h1>
              <p class="text-xl mb-8 max-w-2xl mx-auto">Build amazing websites with our powerful tools and beautiful design system.</p>
              <a href="#get-started" class="btn-primary text-lg">Get Started</a>
            </div>
          </section>

          <section class="py-16">
            <div class="container mx-auto px-4">
              <div class="grid md:grid-cols-3 gap-8">
                <div class="card">
                  <h3 class="text-xl font-semibold mb-4" style="color: #2563eb;">Easy to Use</h3>
                  <p class="text-muted">Our intuitive interface makes it simple to create stunning websites in minutes.</p>
                </div>
                <div class="card">
                  <h3 class="text-xl font-semibold mb-4" style="color: #059669;">Powerful Features</h3>
                  <p class="text-muted">Access advanced tools and features that help you build better websites faster.</p>
                </div>
                <div class="card">
                  <h3 class="text-xl font-semibold mb-4" style="color: #dc2626;">Reliable Support</h3>
                  <p class="text-muted">Get help whenever you need it with our dedicated support team.</p>
                </div>
              </div>
            </div>
          </section>

          <footer class="footer">
            <div class="container mx-auto px-4">
              <div class="social-links mb-4">
                <a href="#" style="color: #1da1f2;">Twitter</a>
                <a href="#" style="color: #1877f2;">Facebook</a>
                <a href="#" style="color: #0077b5;">LinkedIn</a>
                <a href="#" style="color: #333333;">GitHub</a>
              </div>
              <p>&copy; 2024 Company Name. All rights reserved.</p>
            </div>
          </footer>
        </body>
      </html>
    `;

    // Step 1: Extract colors from the website
    const colorAnalysis = extractAllColors(mockWebsiteHTML);

    expect(colorAnalysis.rawColors.length).toBeGreaterThan(15);
    expect(colorAnalysis.palette.primary.length).toBeGreaterThan(0);
    expect(colorAnalysis.palette.secondary.length).toBeGreaterThan(0);

    // Verify we extracted the key brand colors
    expect(colorAnalysis.rawColors).toContain('#2563eb'); // Primary blue
    expect(colorAnalysis.rawColors).toContain('#64748b'); // Secondary gray
    expect(colorAnalysis.rawColors).toContain('#f59e0b'); // Accent yellow
    expect(colorAnalysis.rawColors).toContain('#ffffff'); // Background
    expect(colorAnalysis.rawColors).toContain('#1f2937'); // Text

    // Step 2: Generate CSS variables from the extracted colors
    const cssVariables = generateCSSVariables(colorAnalysis.palette);

    expect(cssVariables['--primary']).toBeDefined();
    expect(cssVariables['--secondary']).toBeDefined();
    expect(cssVariables['--background']).toBeDefined();

    // Step 3: Generate complete globals.css
    const customGlobalsCSS = generateGlobalsCSS(cssVariables);

    expect(customGlobalsCSS).toContain('--primary:');
    expect(customGlobalsCSS).toContain('--secondary:');
    expect(customGlobalsCSS).toContain('--background:');
    expect(customGlobalsCSS).toContain('@import "tailwindcss"');

    // Verify the generated CSS contains our custom colors in OKLCH format
    const primaryMatch = customGlobalsCSS.match(/--primary:\s*([\d.]+)\s+([\d.]+)\s+([\d.]+);/);
    expect(primaryMatch).toBeTruthy();
    expect(parseFloat(primaryMatch![1])).toBeGreaterThan(0); // Lightness
    expect(parseFloat(primaryMatch![2])).toBeGreaterThan(0); // Chroma
    expect(parseFloat(primaryMatch![3])).toBeGreaterThan(0); // Hue

    // Step 4: Test that we can generate a project with these colors
    // (This would be a full integration test that generates an actual project)

    console.log('✅ Successfully extracted colors:', colorAnalysis.rawColors.length);
    console.log('✅ Generated color palette with', Object.keys(colorAnalysis.palette).length, 'categories');
    console.log('✅ Created CSS variables for', Object.keys(cssVariables).length, 'properties');
    console.log('✅ Generated complete globals.css with custom colors');

  }, 10000); // Longer timeout for this comprehensive test

  it('should handle websites with minimal color usage', () => {
    const minimalHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { background: white; color: black; }
            h1 { color: blue; }
          </style>
        </head>
        <body>
          <h1>Hello World</h1>
          <p>This is a simple page.</p>
        </body>
      </html>
    `;

    const colorAnalysis = extractAllColors(minimalHTML);

    expect(colorAnalysis.rawColors.length).toBeGreaterThan(0);
    expect(colorAnalysis.palette.primary.length).toBeGreaterThan(0);

    const cssVariables = generateCSSVariables(colorAnalysis.palette);
    const css = generateGlobalsCSS(cssVariables);

    expect(css).toContain('--primary:');
    expect(css).toContain('--background:');
  });

  it('should handle websites with no CSS (edge case)', () => {
    const noCSSHTML = `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Plain HTML Page</h1>
          <p>No styles here.</p>
        </body>
      </html>
    `;

    const colorAnalysis = extractAllColors(noCSSHTML);

    // Should still generate a palette, even if minimal
    expect(colorAnalysis.palette).toBeDefined();

    const cssVariables = generateCSSVariables(colorAnalysis.palette);
    const css = generateGlobalsCSS(cssVariables);

    // Should still generate valid CSS
    expect(css).toContain(':root {');
    expect(css).toContain('.dark {');
  });

  it('should generate semantically appropriate color assignments', () => {
    // Test with colors that have clear semantic meanings
    const semanticHTML = `
      <div style="color: #dc2626;">Error message</div>
      <div style="color: #059669;">Success message</div>
      <div style="color: #d97706;">Warning message</div>
      <div style="color: #2563eb;">Info message</div>
      <button style="background: #2563eb; color: white;">Primary action</button>
      <button style="background: #6b7280; color: white;">Secondary action</button>
    `;

    const colorAnalysis = extractAllColors(semanticHTML);

    // Should categorize red as error
    expect(colorAnalysis.palette.semantic.error).toContain('#dc2626');

    // Should categorize green as success
    expect(colorAnalysis.palette.semantic.success).toContain('#059669');

    // Should categorize yellow/orange as warning
    expect(colorAnalysis.palette.semantic.warning).toContain('#d97706');

    // Should categorize blue as info/primary
    expect(colorAnalysis.palette.semantic.info).toContain('#2563eb');
    expect(colorAnalysis.palette.primary).toContain('#2563eb');

    // Should categorize gray as secondary
    expect(colorAnalysis.palette.secondary).toContain('#6b7280');
  });
});
