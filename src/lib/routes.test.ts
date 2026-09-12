import { describe, expect, it } from 'vitest';
import { getDashboardPath, getLoginPathForRole } from '@/lib/routes';
import type { UserRole } from '@/types/models';

describe('getDashboardPath', () => {
  const expected: Record<UserRole, string> = {
    admin: '/admin',
    teacher: '/teacher',
    student: '/student',
    parent: '/parent',
    super_admin: '/platform',
    platform_admin: '/platform',
  };

  it.each(Object.entries(expected))('maps %s to %s', (role, path) => {
    expect(getDashboardPath(role as UserRole)).toBe(path);
  });
});

describe('getLoginPathForRole', () => {
  it('sends platform roles to /platform/login', () => {
    expect(getLoginPathForRole('super_admin')).toBe('/platform/login');
    expect(getLoginPathForRole('platform_admin')).toBe('/platform/login');
  });

  it('sends students and parents to portal logins', () => {
    expect(getLoginPathForRole('student')).toContain('student');
    expect(getLoginPathForRole('parent')).toContain('parent');
  });
});
