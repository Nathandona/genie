/**
 * URL manipulation utilities
 */

export function toRelativeHref(url: string): string {
  try {
    // If it's already a relative path (starts with /, ?, #, or .), return as-is
    if (url.startsWith('/') || url.startsWith('?') || url.startsWith('#') || url.startsWith('.')) {
      return url;
    }

    // Check if it has a protocol (contains :// or starts with protocol:)
    if (url.includes('://') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) {
      const urlObj = new URL(url);

      // For http/https URLs, convert to relative path
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        return urlObj.pathname + urlObj.search + urlObj.hash;
      }

      // For other protocols (mailto:, tel:, etc.), keep the full URL
      return url;
    }

    // If no protocol, assume it's a relative path
    return url;
  } catch {
    // If parsing fails, return the original URL
    return url;
  }
}
