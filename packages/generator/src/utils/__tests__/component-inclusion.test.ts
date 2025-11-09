import { describe, it, expect } from 'vitest';
import { getRequiredComponents } from '../component-inclusion.js';

describe('Component Inclusion', () => {
  describe('getRequiredComponents', () => {
    it('should detect shadcn components from import statements', () => {
      const pageContents = [
        {
          path: 'page1.tsx',
          content: `
            import { Button } from "@/components/ui/button";
            import { Card, CardContent } from "@/components/ui/card";
            import { Input } from "@/components/ui/input";
          `
        },
        {
          path: 'page2.tsx',
          content: `
            import { NavigationMenu } from "@/components/ui/navigation-menu";
            import { Badge } from "@/components/ui/badge";
          `
        }
      ];

      const result = getRequiredComponents(pageContents);

      expect(result).toEqual(['badge', 'button', 'card', 'input', 'navigation-menu']);
    });

    it('should handle empty content', () => {
      const pageContents = [{ path: 'empty.tsx', content: '' }];
      const result = getRequiredComponents(pageContents);
      expect(result).toEqual([]);
    });

    it('should skip non-shadcn imports', () => {
      const pageContents = [
        {
          path: 'page.tsx',
          content: `
            import React from 'react';
            import { Button } from "@/components/ui/button";
            import { useState } from 'react';
            import { CustomComponent } from '@/components/custom';
          `
        }
      ];

      const result = getRequiredComponents(pageContents);
      expect(result).toEqual(['button']);
    });

    it('should handle single quotes and double quotes', () => {
      const pageContents = [
        {
          path: 'page.tsx',
          content: `
            import { Button } from "@/components/ui/button";
            import { Card } from '@/components/ui/card';
          `
        }
      ];

      const result = getRequiredComponents(pageContents);
      expect(result).toEqual(['button', 'card']);
    });
  });
});
