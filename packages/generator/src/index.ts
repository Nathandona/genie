import { dirname, join } from 'node:path';

import fs from 'fs-extra';
import mustache from 'mustache';
import { z } from 'zod';

const fileConfigSchema = z.object({
  template: z.string(),
  context: z.record(z.any()).default({})
});

const generationSchema = z.object({
  outputDir: z.string(),
  files: z.record(fileConfigSchema)
});

export type GenerationConfig = z.infer<typeof generationSchema>;

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
