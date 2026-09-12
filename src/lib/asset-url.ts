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
    return toApiStoragePath(path.startsWith('/') ? path.slice(1) : path);
  }

  const protocolRelative = u.match(/^\/\/storage(\/.*)$/i);
  if (protocolRelative) {
    const path = protocolRelative[1].replace(/^\/storage\//, '/');
    return toApiStoragePath(path.startsWith('/') ? path.slice(1) : path);
  }

  // Absolute backend URL with /storage/...
  const storageAbs = u.match(/^https?:\/\/[^/]+\/storage\/(.+)$/i);
  if (storageAbs) return toApiStoragePath(storageAbs[1]);

  if (/^https?:\/\//i.test(u)) return u;

  // /storage/1/file.png or storage/1/file.png
  if (u.startsWith('/storage/')) return toApiStoragePath(u.slice('/storage/'.length));
  if (u.startsWith('storage/')) return toApiStoragePath(u.slice('storage/'.length));
  if (u.startsWith('/')) return u;

  // Bare "1/file.png" or "website-images/file.png"
  if (/^\d+\//.test(u) || u.startsWith('website-images/')) return toApiStoragePath(u);

  return u;
}

function toApiStoragePath(relative: string): string {
  const cleaned = relative.replace(/^\/+/, '');
  return `/api/storage/${cleaned}`;
}
