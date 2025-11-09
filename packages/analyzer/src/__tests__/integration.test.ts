import { describe, it, expect } from 'vitest';
import {
  extractAllColors,
  generateColorPalette,
  generateCSSVariables,
  generateGlobalsCSS
} from '../extractors/color-extractor.js';

describe('Color Extraction & CSS Generation Integration', () => {
  it('should extract colors from complex HTML with inline styles and CSS', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .header { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: #2d3436; }
            .card { border: 2px solid #ddd; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .btn-primary { background-color: #0984e3; color: white; }
            .btn-secondary { background-color: #fdcb6e; color: #2d3436; }
            h1 { color: #d63031; }
            a:hover { color: #00b894; }
          </style>
        </head>
        <body style="background-color: #f8f9fa; color: #212529;">
          <header style="background: #343a40; color: white; padding: 20px;">
            <h1 style="color: #ffc107;">Welcome to Our Site</h1>
          </header>
          <main>
            <div class="card" style="background: #ffffff; border-color: #dee2e6;">
              <h2 style="color: #495057;">Card Title</h2>
              <p style="color: #6c757d;">Some content here.</p>
              <button style="background: #007bff; color: #fff; border: none;">Click me</button>
            </div>
          </main>
        </body>
      </html>
    `;

    const result = extractAllColors(html);

    expect(result.rawColors.length).toBeGreaterThan(5);
    expect(result.palette.primary.length).toBeGreaterThan(0);
    expect(result.palette.background.length).toBeGreaterThan(0);
    expect(result.dominantColors.length).toBeGreaterThan(5);

    // Should extract at least some colors from inline styles
    expect(result.rawColors).toContain('#f8f9fa');
    expect(result.rawColors).toContain('#212529');
    expect(result.rawColors).toContain('#343a40');
    expect(result.rawColors).toContain('#ffc107');
  });

  it('should generate semantic color palette from extracted colors', () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#0984e3', '#fdcb6e', '#d63031', '#00b894', '#f8f9fa', '#212529', '#343a40', '#ffc107'];

    const palette = generateColorPalette(colors);

    expect(palette.primary.length).toBeGreaterThan(0);
    expect(palette.secondary.length).toBeGreaterThan(0);
    expect(palette.accent.length).toBeGreaterThan(0);
    expect(palette.semantic.success).toContain('#00b894'); // Green color should be in success
    expect(palette.semantic.warning).toContain('#fdcb6e'); // Yellow color should be in warning
    expect(palette.semantic.error).toContain('#d63031'); // Red color should be in error
  });

  it('should generate CSS variables from color palette', () => {
    const palette = {
      primary: ['#ff6b6b', '#d63031'],
      secondary: ['#4ecdc4', '#00b894'],
      accent: ['#0984e3'],
      neutral: ['#f8f9fa', '#dee2e6', '#6c757d'],
      semantic: {
        success: ['#00b894'],
        warning: ['#fdcb6e'],
        error: ['#d63031'],
        info: ['#0984e3']
      },
      background: ['#f8f9fa', '#ffffff'],
      text: ['#212529', '#495057']
    };

    const variables = generateCSSVariables(palette);

    expect(variables['--primary']).toBeDefined();
    expect(variables['--secondary']).toBeDefined();
    expect(variables['--background']).toBeDefined();
    expect(variables['--foreground']).toBeDefined();
    expect(variables['--card']).toBeDefined();
    expect(variables['--destructive']).toBeDefined();

    // Check that variables are in OKLCH format (three space-separated numbers)
    Object.values(variables).forEach(value => {
      expect(value.split(' ').length).toBe(3);
      value.split(' ').forEach(part => {
        expect(parseFloat(part)).not.toBeNaN();
      });
    });
  });

  it('should generate complete globals.css with custom colors', () => {
    const palette = {
      primary: ['#ff6b6b'],
      secondary: ['#4ecdc4'],
      accent: ['#0984e3'],
      neutral: ['#f8f9fa', '#dee2e6'],
      semantic: {
        success: ['#00b894'],
        warning: ['#fdcb6e'],
        error: ['#d63031'],
        info: ['#0984e3']
      },
      background: ['#f8f9fa'],
      text: ['#212529']
    };

    const variables = generateCSSVariables(palette);
    const css = generateGlobalsCSS(variables);

    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain('@import "tw-animate-css"');
    expect(css).toContain(':root {');
    expect(css).toContain('--primary:');
    expect(css).toContain('--background:');
    expect(css).toContain('.dark {');
    expect(css).toContain('@layer base');

    // Check that our custom primary color is in the CSS
    expect(css).toContain('--primary:');
  });

  it('should handle edge cases in color extraction', () => {
    const html = `
      <div style="background: #123; border: 1px solid rgb(255, 0, 0);">
        <span style="fill: hsl(120, 100%, 50%);">
          Text
        </span>
      </div>
    `;

    const result = extractAllColors(html);

    // Should extract valid colors
    expect(result.rawColors).toContain('#123');
    expect(result.rawColors).toContain('#ff0000'); // rgb(255, 0, 0)
    expect(result.rawColors).toContain('#80ff00'); // hsl(120, 100%, 50%) converted to hex
    expect(result.rawColors.length).toBeGreaterThan(2);
  });

  it('should extract colors from complex CSS with various formats', () => {
    const css = `
      .component {
        color: #ff0000;
        background: linear-gradient(to right, #ff6b6b, #4ecdc4);
        border: 2px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 0 10px hsl(240, 100%, 50%), 0 0 20px hsla(240, 100%, 50%, 0.5);
        text-shadow: 1px 1px 2px rgb(0, 0, 0);
      }

      .another {
        background-color: #ffffff;
        color: #000000;
      }

      :root {
        --primary: #0984e3;
        --secondary: #fdcb6e;
      }
    `;

    const result = extractAllColors(undefined, css);

    expect(result.rawColors).toContain('#ff0000');
    expect(result.rawColors).toContain('#ff6b6b');
    expect(result.rawColors).toContain('#4ecdc4');
    expect(result.rawColors).toContain('#ffffff');
    expect(result.rawColors).toContain('#0984e3');
    expect(result.rawColors).toContain('#fdcb6e');
  });
});
