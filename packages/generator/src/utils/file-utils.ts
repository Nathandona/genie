import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import fs from 'fs-extra';

/**
 * File and system utilities
 */

export async function execCommand(command: string, args: string[], options: { cwd: string; timeout?: number }): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use npx for package manager commands to avoid path issues
    let actualCommand: string;
    let actualArgs: string[];

    if (command === 'pnpm') {
      actualCommand = '/usr/bin/npx';
      actualArgs = ['pnpm', ...args];
    } else {
      actualCommand = command;
      actualArgs = args;
    }

    console.log(`Running: ${actualCommand} ${actualArgs.join(' ')}`);

    const child = spawn(actualCommand, actualArgs, {
      cwd: options.cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        PATH: '/usr/local/bin:/usr/bin:/bin' // Ensure common paths are available
      }
    });

    const timeout = options.timeout || 30000;

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Command timed out after ${timeout}ms: ${actualCommand} ${actualArgs.join(' ')}`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}: ${actualCommand} ${actualArgs.join(' ')}`));
      }
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(new Error(`Command execution failed: ${error.message}`));
    });
  });
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
}

export async function copyTemplate(templateDir: string, projectDir: string, customFaviconPath: string | null): Promise<void> {
  await fs.copy(templateDir, projectDir, {
    filter: (src, dest) => {
      // Skip node_modules to keep the copy fast and avoid bloat
      if (src.includes('node_modules')) {
        return false;
      }

      // If we have a custom favicon, skip copying the template favicon
      if (customFaviconPath && src.endsWith('favicon.ico')) {
        return false;
      }

      return true;
    }
  });
}
