import type { User, UserRole } from '@/types/models';
import { getParentLoginPath, getStudentLoginPath, getTenantLoginPath } from '@/lib/tenant-routes';

export function getDashboardPath(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
    parent: '/parent',
    super_admin: '/platform',
    platform_admin: '/platform',
  };
  return map[role];
}

/** Where to send the user after sign-out (or session expiry) for their role. */
export function getLoginPathForRole(role: UserRole, tenantSlug?: string | null): string {
  switch (role) {
    case 'super_admin':
    case 'platform_admin':
      return '/platform/login';
    case 'student':
      return getStudentLoginPath();
    case 'parent':
      return getParentLoginPath();
    case 'admin':
    case 'teacher':
      return getTenantLoginPath(tenantSlug);
    default:
      return getTenantLoginPath(tenantSlug);
  }
}

export function getLoginPathForUser(user: User): string {
  return getLoginPathForRole(user.role, user.tenant_slug);
}
