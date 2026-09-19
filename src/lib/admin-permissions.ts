import type { User } from '@/types/models';

const KNOWN_ACTIONS = ['view', 'create', 'edit', 'delete', 'update', 'manage', 'assign', 'export', 'import'];

export function splitPermission(permission: string): { module: string; action: string } {
  const normalized = permission.trim().toLowerCase();

  if (normalized.includes('.')) {
    const [left, right] = normalized.split('.', 2);
    if (KNOWN_ACTIONS.includes(left)) return { module: right || 'general', action: left };
    if (KNOWN_ACTIONS.includes(right)) return { module: left || 'general', action: right };
    return { module: left || 'general', action: right || 'access' };
  }

  const tokens = normalized.split(/[\s\-_:/]+/).filter(Boolean);
  if (tokens.length >= 2) {
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    if (KNOWN_ACTIONS.includes(first)) {
      return { module: tokens.slice(1).join('_') || 'general', action: first };
    }
    if (KNOWN_ACTIONS.includes(last)) {
      return { module: tokens.slice(0, -1).join('_') || 'general', action: last };
    }
    return { module: first, action: tokens.slice(1).join('_') || 'access' };
  }

  return { module: 'general', action: normalized || 'access' };
}

/** Longest prefix first. Names match RolesAndPermissionsSeeder modules. */
const ADMIN_PATH_MODULES: Array<{ prefix: string; modules: string[] }> = [
  { prefix: '/admin/reports/attendance', modules: ['reports', 'attendance'] },
  { prefix: '/admin/reports/exams', modules: ['reports', 'exams', 'exam'] },
  { prefix: '/admin/reports/quizzes', modules: ['reports', 'quizzes', 'quiz'] },
  { prefix: '/admin/reports/payments', modules: ['reports', 'payments', 'payment'] },
  { prefix: '/admin/reports', modules: ['reports'] },
  { prefix: '/admin/students', modules: ['students', 'student'] },
  { prefix: '/admin/teachers', modules: ['teachers', 'teacher'] },
  { prefix: '/admin/parents', modules: ['parents', 'parent'] },
  { prefix: '/admin/grades', modules: ['grades', 'grade'] },
  { prefix: '/admin/classes', modules: ['classes', 'class'] },
  { prefix: '/admin/sections', modules: ['sections', 'section'] },
  { prefix: '/admin/units', modules: ['units', 'unit'] },
  { prefix: '/admin/lessons', modules: ['lessons', 'lesson'] },
  { prefix: '/admin/questions', modules: ['questions', 'question'] },
  { prefix: '/admin/questions/bulk', modules: ['questions', 'question'] },
  { prefix: '/admin/exam-bank', modules: ['exams', 'exam', 'generated_exams', 'generated_exam', 'questions', 'question'] },
  { prefix: '/admin/generated-exams', modules: ['exams', 'exam', 'generated_exams', 'generated_exam', 'questions', 'question'] },
  { prefix: '/admin/homework', modules: ['homework'] },
  { prefix: '/admin/library', modules: ['library'] },
  { prefix: '/admin/sessions', modules: ['sessions', 'session'] },
  { prefix: '/admin/attendance', modules: ['attendance'] },
  { prefix: '/admin/exams', modules: ['exams', 'exam'] },
  { prefix: '/admin/quizzes', modules: ['quizzes', 'quiz'] },
  { prefix: '/admin/fees', modules: ['fees', 'fee'] },
  { prefix: '/admin/payments', modules: ['payments', 'payment'] },
  { prefix: '/admin/announcements', modules: ['announcements', 'announcement'] },
  { prefix: '/admin/chat', modules: ['chat'] },
  { prefix: '/admin/notifications', modules: ['notifications', 'notification'] },
  { prefix: '/admin/whatsapp', modules: ['whatsapp'] },
  { prefix: '/admin/certifications', modules: ['certifications', 'certification'] },
  { prefix: '/admin/landing', modules: ['landing'] },
  { prefix: '/admin/users', modules: ['users', 'user'] },
  { prefix: '/admin/roles', modules: ['roles', 'role'] },
  { prefix: '/admin/settings', modules: ['settings', 'setting'] },
  { prefix: '/admin/todos', modules: ['todos', 'todo'] },
  { prefix: '/admin/notes', modules: ['notes', 'note'] },
];

const ALWAYS_ALLOWED = new Set(['/admin']);

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(item => String(item)).filter(Boolean);
  }
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).map(item => String(item)).filter(Boolean);
  }
  return [];
}

function normalizeModule(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function expandModule(value: string): string[] {
  const base = normalizeModule(value);
  const out = new Set([base, base.replace(/_/g, ' ')]);
  if (base.endsWith('s')) out.add(base.slice(0, -1));
  else out.add(`${base}s`);
  return [...out];
}

export function hasFullAdminAccess(user: Pick<User, 'roles' | 'permissions'> | null | undefined): boolean {
  if (!user) return false;
  const roles = toStringList(user.roles);
  const permissions = toStringList(user.permissions);
  if (roles.some(role => role.trim().toLowerCase() === 'admin')) return true;
  return permissions.some(permission => permission.trim() === '*');
}

export function hasViewPermission(
  permissions: string[] | undefined,
  modules: string[],
): boolean {
  const owned = toStringList(permissions);
  const needed = new Set(modules.flatMap(expandModule));

  return owned.some(permission => {
    const { module, action } = splitPermission(permission);
    if (!['view', 'manage'].includes(action)) {
      return false;
    }

    return expandModule(module).some(alias => needed.has(alias));
  });
}

export function canAccessAdminPath(
  pathname: string,
  user: Pick<User, 'roles' | 'permissions'> | null | undefined,
): boolean {
  const path = pathname.replace(/\/+$/, '') || '/admin';
  if (ALWAYS_ALLOWED.has(path) || path === '/admin') return true;
  if (hasFullAdminAccess(user)) return true;

  const match = ADMIN_PATH_MODULES.find(entry => path === entry.prefix || path.startsWith(`${entry.prefix}/`));
  if (!match) return false;

  return hasViewPermission(user?.permissions, match.modules);
}

export function filterByAdminAccess<T extends { path: string }>(
  items: T[],
  user: Pick<User, 'roles' | 'permissions'> | null | undefined,
): T[] {
  return items.filter(item => canAccessAdminPath(item.path, user));
}
