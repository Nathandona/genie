import { exec, spawn, type ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createWriteStream } from 'node:fs';

const execAsync = promisify(exec);

interface PreviewInstance {
  projectId: string;
  port: number;
  process: ChildProcess;
  projectDir: string;
  startedAt: Date;
}

// Store active preview instances
const activePreviews = new Map<string, PreviewInstance>();

// Port range for preview servers (3000-3999)
const MIN_PORT = 3000;
const MAX_PORT = 3999;
let nextPort = MIN_PORT;

function getNextAvailablePort(): number {
  const usedPorts = new Set(Array.from(activePreviews.values()).map(p => p.port));
  let port = nextPort;
  
  while (usedPorts.has(port)) {
    port++;
    if (port > MAX_PORT) {
      port = MIN_PORT; // Wrap around
    }
  }
  
  nextPort = port + 1;
  if (nextPort > MAX_PORT) {
    nextPort = MIN_PORT;
  }
  
  return port;
}

export async function startPreview(projectId: string, zipPath: string): Promise<{ url: string; port: number }> {
  // Disable preview service in production/Vercel (requires long-running processes)
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    throw new Error('Preview service is not available in production. Preview feature requires a long-running server process which is not supported on Vercel serverless functions.');
  }

  // Check if preview already exists
  if (activePreviews.has(projectId)) {
    const existing = activePreviews.get(projectId)!;
    return { url: `http://localhost:${existing.port}`, port: existing.port };
  }

  // Extract ZIP to temp directory
  const projectDir = join(tmpdir(), `genie-preview-${projectId}`);
  
  // Clean up if directory exists
  if (existsSync(projectDir)) {
    await rm(projectDir, { recursive: true, force: true });
  }
  
  await mkdir(projectDir, { recursive: true });

  // Extract ZIP file using unzip command (or yauzl as fallback)
  try {
    // Try using system unzip command first (faster)
    await execAsync(`unzip -q "${zipPath}" -d "${projectDir}"`, {
      timeout: 30_000,
    });
  } catch (error) {
    // Fallback: use Node.js yauzl library if unzip command not available
    try {
      const yauzlModule = await import('yauzl');
      const yauzl = yauzlModule.default || yauzlModule;
      
      const zip = await new Promise<any>((resolve, reject) => {
        yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
          if (err) reject(err);
          else resolve(zipfile);
        });
      });
      
      await new Promise<void>((resolve, reject) => {
        zip.on('entry', (entry: any) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            mkdir(join(projectDir, entry.fileName), { recursive: true }).catch(() => {});
            zip.readEntry();
          } else {
            // File entry
            zip.openReadStream(entry, async (err: Error | null, readStream: NodeJS.ReadableStream | null) => {
              if (err || !readStream) {
                zip.readEntry();
                return;
              }
              const fullPath = join(projectDir, entry.fileName);
              await mkdir(dirname(fullPath), { recursive: true });
              const writeStream = createWriteStream(fullPath);
              readStream.pipe(writeStream);
              writeStream.on('close', () => zip.readEntry());
            });
          }
        });
        
        zip.on('end', resolve);
        zip.on('error', reject);
        zip.readEntry();
      });
    } catch (fallbackError) {
      await rm(projectDir, { recursive: true, force: true }).catch(() => {});
      throw new Error(`Failed to extract ZIP: ${(error as Error).message}`);
    }
  }

  // Find the actual project directory (might be nested)
  let actualProjectDir = projectDir;
  const entries = await import('node:fs/promises');
  const dirEntries = await entries.readdir(projectDir);
  
  // If there's only one directory and it's not the root, use it
  if (dirEntries.length === 1) {
    const firstEntry = dirEntries[0];
    const fullPath = join(projectDir, firstEntry);
    const stat = await entries.stat(fullPath);
    if (stat.isDirectory()) {
      actualProjectDir = fullPath;
    }
  }

  // Install dependencies
  try {
    await execAsync('pnpm install', {
      cwd: actualProjectDir,
      timeout: 120_000, // 2 minutes
      env: {
        ...process.env,
        CI: 'true', // Skip interactive prompts
      }
    });
  } catch (error) {
    await rm(projectDir, { recursive: true, force: true }).catch(() => {});
    throw new Error(`Failed to install dependencies: ${(error as Error).message}`);
  }

  // Get available port
  const port = getNextAvailablePort();

  // Start dev server
  const devProcess = spawn('pnpm', ['dev', '--port', port.toString()], {
    cwd: actualProjectDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: port.toString(),
    },
    detached: false,
  });

  // Store preview instance
  const preview: PreviewInstance = {
    projectId,
    port,
    process: devProcess,
    projectDir,
    startedAt: new Date(),
  };

  activePreviews.set(projectId, preview);

  // Handle process exit
  devProcess.on('exit', () => {
    activePreviews.delete(projectId);
    // Cleanup project directory after a delay
    setTimeout(() => {
      rm(projectDir, { recursive: true, force: true }).catch(() => {});
    }, 5000);
  });

  // Log output for debugging
  devProcess.stdout?.on('data', (data) => {
    console.log(`[Preview ${projectId}] ${data.toString()}`);
  });

  devProcess.stderr?.on('data', (data) => {
    console.error(`[Preview ${projectId}] ${data.toString()}`);
  });

  // Wait a bit for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return { url: `http://localhost:${port}`, port };
}

export async function stopPreview(projectId: string): Promise<void> {
  const preview = activePreviews.get(projectId);
  if (!preview) {
    return;
  }

  // Kill the process
  preview.process.kill('SIGTERM');
  
  // Wait a bit then force kill if needed
  setTimeout(() => {
    if (!preview.process.killed) {
      preview.process.kill('SIGKILL');
    }
  }, 5000);

  activePreviews.delete(projectId);

  // Cleanup project directory
  await rm(preview.projectDir, { recursive: true, force: true }).catch(() => {});
}

export function getPreviewStatus(projectId: string): { url: string; port: number; startedAt: Date } | null {
  const preview = activePreviews.get(projectId);
  if (!preview) {
    return null;
  }

  return {
    url: `http://localhost:${preview.port}`,
    port: preview.port,
    startedAt: preview.startedAt,
  };
}

// Cleanup all previews on process exit
process.on('SIGTERM', () => {
  for (const [projectId] of activePreviews) {
    stopPreview(projectId).catch(() => {});
  }
});

process.on('SIGINT', () => {
  for (const [projectId] of activePreviews) {
    stopPreview(projectId).catch(() => {});
  }
});

