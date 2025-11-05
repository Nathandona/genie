import postcss, { type Declaration } from 'postcss';
import valueParser, { type Node as ValueNode } from 'postcss-value-parser';
import { colord } from 'colord';
import { z } from 'zod';

export interface DesignTokenSummary {
  colors: string[];
  fonts: string[];
  spacingScale: number[];
}

const analyzerInputSchema = z.object({
  css: z.string()
});

export const analyzeDesignTokens = (input: z.infer<typeof analyzerInputSchema>): DesignTokenSummary => {
  const { css } = analyzerInputSchema.parse(input);

  const colors = new Set<string>();
  const fonts = new Set<string>();
  const spacing = new Set<number>();

  const root = postcss.parse(css);

  root.walkDecls((decl: Declaration) => {
    const parsed = valueParser(decl.value);
    parsed.walk((node: ValueNode) => {
      if (node.type !== 'word') {
        return;
      }

      const color = colord(node.value);
      if (color.isValid()) {
        colors.add(color.toHex().toLowerCase());
      }

      const numeric = Number.parseFloat(node.value);
      if (
        !Number.isNaN(numeric) &&
        (decl.prop.includes('margin') || decl.prop.includes('padding'))
      ) {
        spacing.add(Math.round(numeric));
      }
    });

    if (decl.prop === 'font-family') {
      fonts.add(decl.value.replaceAll('"', '').trim());
    }
  });

  return {
    colors: Array.from(colors).slice(0, 12),
    fonts: Array.from(fonts),
    spacingScale: Array.from(spacing).sort((a, b) => a - b)
  };
};
