#!/usr/bin/env node
/**
 * Production migration script for Vercel deployment
 * Run this after deploying to ensure database schema is up to date
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiDir = join(__dirname, '../apps/api');

try {
  console.log('Running Prisma migrations...');
  execSync('pnpm prisma migrate deploy', {
    cwd: apiDir,
    stdio: 'inherit',
  });
  console.log('✅ Migrations completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

