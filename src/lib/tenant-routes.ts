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
]);

const TENANT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export function isValidTenantSlug(slug: string | undefined): slug is string {
  if (!slug || !TENANT_SLUG_PATTERN.test(slug)) return false;
  return !reservedTenantSlugs.has(slug.toLowerCase());
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
