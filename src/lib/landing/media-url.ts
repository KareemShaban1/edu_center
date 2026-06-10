/** Normalize stored media paths so images load in the Vite dev server and production. */
export function resolveLandingAssetUrl(url: string | undefined | null): string {
  if (!url?.trim()) return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Rewrite absolute backend URLs (e.g. http://localhost:8000/storage/...) to current origin.
  const storageMatch = trimmed.match(/\/storage\/[^\s?#]+/);
  if (storageMatch && typeof window !== 'undefined') {
    return `${window.location.origin}${storageMatch[0]}`;
  }

  if (trimmed.startsWith('/')) {
    return typeof window !== 'undefined' ? `${window.location.origin}${trimmed}` : trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function normalizeMediaUrl(url: string): string {
  const storageMatch = url.match(/\/storage\/[^\s?#]+/);
  if (storageMatch) return storageMatch[0];
  return url;
}
