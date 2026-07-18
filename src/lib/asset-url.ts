/**
 * Resolves image/media URLs for display in the SPA.
 * Laravel uploads return /storage/... or absolute URLs — normalize for same-origin fetch.
 */
export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url?.trim()) return '';
  const u = url.trim();

  // Broken production URLs when APP_URL/disk URL is wrong: https://storage/1/file.png
  const brokenHost = u.match(/^https?:\/\/storage(\/.*)$/i);
  if (brokenHost) {
    const path = brokenHost[1];
    return path.startsWith('/storage/') ? path : `/storage${path}`;
  }

  // Protocol-relative //storage/1/file.png
  const protocolRelative = u.match(/^\/\/storage(\/.*)$/i);
  if (protocolRelative) {
    const path = protocolRelative[1];
    return path.startsWith('/storage/') ? path : `/storage${path}`;
  }

  const storagePath = u.match(/^https?:\/\/[^/]+(\/storage\/.+)$/i);
  if (storagePath) return storagePath[1];

  if (/^https?:\/\//i.test(u)) return u;

  if (u.startsWith('storage/')) return `/${u}`;
  if (u.startsWith('/')) return u;

  // Bare "1/file.png" from media relative path
  if (/^\d+\//.test(u)) return `/storage/${u}`;

  return u;
}
