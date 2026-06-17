import { defaultTenantSlug } from '@/config/login-defaults';
import { apiClient } from '@/services/api-client';

/** App route segments that cannot be used as tenant slugs in `/:tenantSlug/login`. */
export const reservedTenantSlugs = new Set([
  'admin',
  'teacher',
  'student',
  'parent',
  'platform',
  'login',
  'api',
  'p',
]);

const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function isValidTenantSlug(slug: string | undefined): slug is string {
  if (!slug || !TENANT_SLUG_PATTERN.test(slug)) return false;
  return !reservedTenantSlugs.has(slug.toLowerCase());
}

export function getStudentLoginPath(): string {
  return '/student/login';
}

export function getParentLoginPath(): string {
  return '/parent/login';
}

export function getTenantLoginPath(tenantSlug?: string | null): string {
  const slug = tenantSlug || apiClient.getTenantContext().tenantSlug || defaultTenantSlug;
  return `/${slug}/login`;
}

export function normalizeTenantSlug(raw: string | undefined): string | null {
  const slug = raw?.trim().toLowerCase();
  if (!isValidTenantSlug(slug)) return null;
  return slug;
}

export function resolvePublicLandingTenant(explicit?: string | null): string {
  return normalizeTenantSlug(explicit ?? undefined)
    ?? apiClient.getTenantContext().tenantSlug
    ?? defaultTenantSlug;
}

/** Parses `/demo/p/my-page` or `/p/my-page` into tenant + slug segments. */
export function parsePublicLandingRoute(pathname: string): { tenantSlug: string | null; slug: string } {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  const tenantMatch = normalized.match(/^\/([^/]+)\/p\/(.+)$/);
  if (tenantMatch) {
    const tenantSlug = normalizeTenantSlug(tenantMatch[1]);
    if (tenantSlug) {
      return { tenantSlug, slug: decodeURIComponent(tenantMatch[2]) };
    }
  }

  const simpleMatch = normalized.match(/^\/p\/(.+)$/);
  if (simpleMatch) {
    return { tenantSlug: null, slug: decodeURIComponent(simpleMatch[1]) };
  }

  return { tenantSlug: null, slug: '' };
}

export function getPublicLandingPath(
  slug: string,
  tenantSlug?: string | null,
  options?: { preview?: boolean },
): string {
  const tenant = resolvePublicLandingTenant(tenantSlug);
  const base = `/${tenant}/p/${slug}`;
  if (options?.preview) {
    return `${base}?preview=1`;
  }
  return base;
}
