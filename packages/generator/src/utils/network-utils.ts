import { get } from 'node:https';
import { join } from 'node:path';
import fs from 'fs-extra';

/**
 * Network utilities for downloading assets
 */

export async function downloadFavicon(sourceUrl: string, outputDir: string): Promise<string | null> {
  try {
    // Extract domain from source URL
    const urlObj = new URL(sourceUrl);
    const domain = urlObj.origin;

    // Try to download favicon.ico
    const faviconUrl = `${domain}/favicon.ico`;
    const faviconPath = join(outputDir, 'favicon.ico');

    return new Promise((resolve) => {
      const request = get(faviconUrl, (response) => {
        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }

        const fileStream = fs.createWriteStream(faviconPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(faviconPath);
        });

        fileStream.on('error', () => {
          resolve(null);
        });
      });

      request.on('error', () => {
        resolve(null);
      });

      // Timeout after 5 seconds
      request.setTimeout(5000, () => {
        request.destroy();
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}
