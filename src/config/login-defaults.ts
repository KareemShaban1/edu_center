/**
 * Default sign-in fields per guard (dev / staging convenience).
 * Adjust for your environment; do not commit production secrets.
 */

export type TenantGuardDefaults = {
  email: string;
  password: string;
  tenantSlug: string;
};

export type PlatformGuardDefaults = {
  email: string;
  password: string;
};

/** Tenant-scoped guards: `users` (admin), teacher, parent, student */
export const tenantLoginDefaults: Record<string, TenantGuardDefaults> = {
  users: { email: 'admin@educenter.com', password: 'password', tenantSlug: 'demo' },
  teacher: { email: 'teacher@educenter.com', password: 'password', tenantSlug: 'demo' },
  parent: { email: 'parent@educenter.com', password: 'password', tenantSlug: 'demo' },
  student: { email: 'student@educenter.com', password: 'password', tenantSlug: 'demo' },
};

export const defaultTenantSlug = 'demo';

export function getTenantDefaultsForGuard(guard: string): TenantGuardDefaults {
  return (
    tenantLoginDefaults[guard] ?? {
      email: '',
      password: '',
      tenantSlug: defaultTenantSlug,
    }
  );
}

export function isPlatformGuard(guard: string): boolean {
  return guard === 'super_admin' || guard === 'platform_admin';
}

/** Central / platform guards (no tenant) */
export const platformLoginDefaults: Record<string, PlatformGuardDefaults> = {
  super_admin: { email: 'superadmin@educenter.com', password: 'password' },
  platform_admin: { email: 'platform@educenter.com', password: 'password' },
};

export function getPlatformDefaultsForGuard(guard: string): PlatformGuardDefaults {
  return platformLoginDefaults[guard] ?? { email: '', password: '' };
}
