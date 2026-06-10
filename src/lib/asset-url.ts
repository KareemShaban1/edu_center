/**
 * Resolves image/media URLs for display in the SPA.
 * Laravel uploads return /storage/... or http://localhost/storage/... — normalize for Vite proxy.
 */
export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url?.trim()) return '';
  const u = url.trim();

  const storagePath = u.match(/^https?:\/\/[^/]+(\/storage\/.+)$/i);
  if (storagePath) return storagePath[1];

  if (/^https?:\/\//i.test(u)) return u;

  if (u.startsWith('storage/')) return `/${u}`;
  if (u.startsWith('/')) return u;

  return u;
}
