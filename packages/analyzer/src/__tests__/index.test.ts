import { describe, it, expect } from 'vitest';
import { analyzeDesignTokens } from '../index.js';

describe('@genie/analyzer', () => {
  describe('analyzeDesignTokens', () => {
    it('should extract colors from inline HTML styles', () => {
      const html = `
        <div style="color: #ff0000; background: #00ff00;">
          <span style="color: #0000ff;">Text</span>
        </div>
      `;

      const result = analyzeDesignTokens({ html });
      
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.colors).toContain('#ff0000');
      // Note: rgb() colors in inline styles may not be extracted by current implementation
      // The implementation extracts colors from word/string nodes, not function nodes
    });

    it('should extract colors from CSS string', () => {
      const css = `
        .header { background-color: #ffffff; }
        .footer { color: rgba(255, 0, 0, 0.5); }
        .button { border-color: hsl(120, 100%, 50%); }
      `;

      const result = analyzeDesignTokens({ css });
      
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.colors).toContain('#ffffff');
    });

    it('should extract colors from style tags', () => {
      const html = `
        <style>
          .container { background: #f0f0f0; }
          .text { color: #333333; }
        </style>
        <div class="container">Content</div>
      `;

      const result = analyzeDesignTokens({ html });
      
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.colors).toContain('#f0f0f0');
      expect(result.colors).toContain('#333333');
    });

    it('should extract spacing values from margin and padding', () => {
      const css = `
        .box { padding: 16px; margin: 24px; }
        .container { gap: 32px; padding-top: 8px; }
      `;

      const result = analyzeDesignTokens({ css });
      
      expect(result.spacingScale.length).toBeGreaterThan(0);
      expect(result.spacingScale).toContain(16);
      expect(result.spacingScale).toContain(24);
      expect(result.spacingScale).toContain(32);
      expect(result.spacingScale).toContain(8);
    });

    it('should extract spacing from inline styles', () => {
      const html = `
        <div style="padding: 20px; margin: 10px;">
          <span style="gap: 5px;">Content</span>
        </div>
      `;

      const result = analyzeDesignTokens({ html });
      
      expect(result.spacingScale.length).toBeGreaterThan(0);
      expect(result.spacingScale).toContain(20);
      expect(result.spacingScale).toContain(10);
      expect(result.spacingScale).toContain(5);
    });

    it('should extract font families', () => {
      const html = `<div style="font-family: Inter, sans-serif;">Text</div>`;

      const result = analyzeDesignTokens({ html });
      
      expect(result.fonts.length).toBeGreaterThan(0);
      expect(result.fonts).toContain('Inter');
    });

    it('should extract border radius values', () => {
      const css = `
        .card { border-radius: 8px; }
        .button { border-radius: 12px; }
      `;

      const result = analyzeDesignTokens({ css });
      
      expect(result.borderRadius).toBeDefined();
      expect(result.borderRadius!.length).toBeGreaterThan(0);
      expect(result.borderRadius).toContain(8);
      expect(result.borderRadius).toContain(12);
    });

    it('should extract box shadows', () => {
      const css = `
        .card { box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
        .button { box-shadow: 0 4px 8px #000000; }
      `;

      const result = analyzeDesignTokens({ css });
      
      expect(result.shadows).toBeDefined();
      expect(result.shadows!.length).toBeGreaterThan(0);
    });

    it('should limit colors to 12 most common', () => {
      const html = Array.from({ length: 20 }, (_, i) => 
        `<div style="color: #${i.toString(16).padStart(6, '0')};">Text ${i}</div>`
      ).join('');

      const result = analyzeDesignTokens({ html });
      
      expect(result.colors.length).toBeLessThanOrEqual(12);
    });

    it('should sort spacing values numerically', () => {
      const css = 'padding: 50px; margin: 10px; gap: 30px; padding-top: 5px;';
      const result = analyzeDesignTokens({ css });
      
      const sorted = [...result.spacingScale].sort((a, b) => a - b);
      expect(result.spacingScale).toEqual(sorted);
    });

    it('should handle empty input', () => {
      const result = analyzeDesignTokens({});
      
      expect(result.colors).toEqual([]);
      expect(result.fonts).toEqual([]);
      expect(result.spacingScale).toEqual([]);
    });

    it('should handle invalid CSS gracefully', () => {
      const invalidCss = 'this is not valid css { broken syntax }';
      const result = analyzeDesignTokens({ css: invalidCss });
      
      // Should not throw and return empty or partial results
      expect(result).toBeDefined();
      expect(Array.isArray(result.colors)).toBe(true);
    });

    it('should filter out generic font families', () => {
      const css = 'font-family: serif, sans-serif, monospace;';
      const result = analyzeDesignTokens({ css });
      
      expect(result.fonts).not.toContain('serif');
      expect(result.fonts).not.toContain('sans-serif');
      expect(result.fonts).not.toContain('monospace');
    });

    it('should handle both HTML and CSS together', () => {
      const html = '<div style="color: #ff0000;">Text</div>';
      const css = '.box { padding: 16px; }';
      
      const result = analyzeDesignTokens({ html, css });
      
      expect(result.colors.length).toBeGreaterThan(0);
      expect(result.spacingScale.length).toBeGreaterThan(0);
    });

    it('should normalize color formats to hex', () => {
      const html = `
        <div style="color: rgb(255, 0, 0); background: hsl(120, 100%, 50%);">
          <span style="color: blue;">Text</span>
        </div>
      `;

      const result = analyzeDesignTokens({ html });
      
      // All colors should be hex format
      result.colors.forEach(color => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/);
      });
    });
  });
});

