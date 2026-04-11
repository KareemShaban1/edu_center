import type { UserRole } from '@/types/models';

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
