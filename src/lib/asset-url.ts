/**
 * Resolves image/media URLs for display in the SPA.
 * Prefer /api/storage/... so production works when nginx only proxies /api to Laravel.
 */
export function resolveAssetUrl(url: string | undefined | null): string {
  if (!url?.trim()) return '';
  const u = url.trim();

  // Already API media route
  if (u.startsWith('/api/storage/')) return u;
  const apiStorageAbs = u.match(/^https?:\/\/[^/]+(\/api\/storage\/.+)$/i);
  if (apiStorageAbs) return apiStorageAbs[1];

  // Broken host: https://storage/1/file.png
  const brokenHost = u.match(/^https?:\/\/storage(\/.*)$/i);
  if (brokenHost) {
    const path = brokenHost[1].replace(/^\/storage\//, '/');
    return `/api/storage${path.startsWith('/') ? path : `/${path}`}`;
  }

  const protocolRelative = u.match(/^\/\/storage(\/.*)$/i);
  if (protocolRelative) {
    const path = protocolRelative[1].replace(/^\/storage\//, '/');
    return `/api/storage${path.startsWith('/') ? path : `/${path}`}`;
  }

  // Absolute backend URL with /storage/...
  const storageAbs = u.match(/^https?:\/\/[^/]+\/storage\/(.+)$/i);
  if (storageAbs) return `/api/storage/${storageAbs[1]}`;

  if (/^https?:\/\//i.test(u)) return u;

  // /storage/1/file.png or storage/1/file.png
  if (u.startsWith('/storage/')) return `/api/storage/${u.slice('/storage/'.length)}`;
  if (u.startsWith('storage/')) return `/api/storage/${u.slice('storage/'.length)}`;
  if (u.startsWith('/')) return u;

  // Bare "1/file.png"
  if (/^\d+\//.test(u)) return `/api/storage/${u}`;

  return u;
}
