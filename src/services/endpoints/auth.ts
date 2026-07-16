import { apiClient, USE_MOCK } from '../api-client';
import { mockUser } from '../mock-data';
import type { User, TenantMembershipOption, ApiError } from '@/types/models';

const AUTH_GUARDS_ENDPOINT = import.meta.env.VITE_AUTH_GUARDS_ENDPOINT || '/auth/guards';
const AUTH_LOGIN_ENDPOINT = import.meta.env.VITE_AUTH_LOGIN_ENDPOINT || '/login';
const AUTH_LOGOUT_ENDPOINT = import.meta.env.VITE_AUTH_LOGOUT_ENDPOINT || '/logout';
const AUTH_ME_ENDPOINT = import.meta.env.VITE_AUTH_ME_ENDPOINT || '/user';

export interface LoginPayload {
  email: string;
  password: string;
  guard?: string;
  role?: string;
  tenantSlug?: string;
  tenantId?: number;
  membershipId?: number;
  portal?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  gender?: 'male' | 'female';
  center_slug?: string;
  grade_id?: number;
  class_id?: number;
  section_id?: number;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    code?: string;
    center_slug?: string | null;
  };
}

export interface LoginResponse {
  user: User;
  token: string;
  memberships?: TenantMembershipOption[];
}

export type LoginResult =
  | { type: 'success'; response: LoginResponse }
  | { type: 'tenant_selection'; memberships: TenantMembershipOption[]; user: Pick<User, 'name' | 'email' | 'role'> };

const guardToRole: Record<string, User['role']> = {
  users: 'admin',
  teacher: 'teacher',
  student: 'student',
  parent: 'parent',
  super_admin: 'super_admin',
  platform_admin: 'super_admin',
  admin: 'admin',
};

type UnknownObject = Record<string, unknown>;

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim()) return Number(value);
  return null;
}

function normalizeRole(rawRole: unknown, rawGuard: unknown): User['role'] {
  const roleCandidate = readString(rawRole).toLowerCase();
  const guardCandidate = readString(rawGuard).toLowerCase();
  const mapped =
    guardToRole[roleCandidate] ||
    guardToRole[guardCandidate] ||
    (['admin', 'teacher', 'student', 'parent', 'super_admin', 'platform_admin'].includes(roleCandidate)
      ? (roleCandidate as User['role'])
      : undefined);
  return mapped || 'admin';
}

function normalizeUser(raw: unknown): User {
  const source = (raw && typeof raw === 'object' ? raw : {}) as UnknownObject;
  const role = normalizeRole(source.role, source.guard_name || source.guard);
  const tenantId = toNumber(source.tenant_id ?? source.tenantId);

  return {
    id: toNumber(source.id) || Date.now(),
    name: readString(source.name, 'User'),
    email: readString(source.email),
    role,
    locale: readString(source.locale, 'en'),
    created_at: readString(source.created_at, new Date().toISOString().slice(0, 10)),
    tenant_id: tenantId,
    tenant_slug: readString(source.tenant_slug ?? source.tenantSlug) || null,
    tenant_name: readString(source.tenant_name ?? source.tenantName) || null,
    portal_mode: Boolean(source.portal_mode ?? source.portalMode),
    center_count: toNumber(source.center_count ?? source.centerCount) ?? undefined,
    avatar: readString(source.avatar) || undefined,
  };
}

function extractAuthEnvelope(raw: unknown): LoginResponse {
  const body = (raw && typeof raw === 'object' ? raw : {}) as UnknownObject;
  const data = (body.data && typeof body.data === 'object' ? body.data : {}) as UnknownObject;
  const user = body.user || data.user || body.profile || data.profile || body;
  const token =
    readString(body.token) ||
    readString(data.token) ||
    readString(body.access_token) ||
    readString(data.access_token) ||
    '';

  const memberships = Array.isArray(body.memberships)
    ? (body.memberships as TenantMembershipOption[])
    : undefined;

  return {
    user: normalizeUser(user),
    token,
    memberships,
  };
}

export const authApi = {
  async getGuards(): Promise<string[]> {
    if (USE_MOCK) return ['users', 'teacher', 'parent', 'student', 'super_admin', 'platform_admin'];

    const raw = await apiClient.get<unknown>(AUTH_GUARDS_ENDPOINT, undefined, false);
    if (Array.isArray(raw)) return raw.map(g => String(g));

    const body = (raw && typeof raw === 'object' ? raw : {}) as UnknownObject;
    const payload =
      (Array.isArray(body.guards) && body.guards) ||
      (Array.isArray((body.data as UnknownObject)?.guards) && ((body.data as UnknownObject).guards as unknown[])) ||
      [];

    return payload.map(g => String(g));
  },

  async loginPortal(payload: LoginPayload): Promise<LoginResponse> {
    apiClient.setTenantContext(null);
    return this.login({ ...payload, portal: true }) as Promise<LoginResponse>;
  },

  async registerParent(payload: RegisterPayload): Promise<RegisterResponse> {
    if (USE_MOCK) {
      return {
        message: 'Parent account created.',
        user: { id: Date.now(), name: payload.name, email: payload.email, phone: payload.phone, role: 'parent' },
      };
    }
    return apiClient.post<RegisterResponse>('/register/parent', payload, false);
  },

  async registerStudent(payload: RegisterPayload & {
    gender: 'male' | 'female';
    grade_id: number;
    class_id: number;
    section_id: number;
    center_slug: string;
  }): Promise<RegisterResponse> {
    if (USE_MOCK) {
      return {
        message: 'Student account created.',
        user: { id: Date.now(), name: payload.name, email: payload.email, phone: payload.phone, role: 'student', code: 'STU-000099' },
      };
    }
    return apiClient.post<RegisterResponse>('/register/student', payload, false);
  },

  async login(payload: LoginPayload): Promise<LoginResult> {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 800));
      const role = guardToRole[payload.guard || payload.role || 'users'] || 'admin';
      const user: User = {
        ...mockUser,
        role,
        tenant_slug: role === 'super_admin' ? null : (payload.tenantSlug || 'default-school'),
        tenant_id: role === 'super_admin' ? null : (payload.tenantId || 1),
        tenant_name: role === 'super_admin' ? 'Platform' : 'Default School',
      };
      return { type: 'success', response: { user, token: 'mock-jwt-token-xyz' } };
    }

    try {
      const raw = await apiClient.post<unknown>(AUTH_LOGIN_ENDPOINT, {
        ...payload,
        guard: payload.guard,
        portal: payload.portal ?? false,
        tenant_slug: payload.tenantSlug,
        tenant_id: payload.tenantId,
        membership_id: payload.membershipId,
      }, false);
      const parsed = extractAuthEnvelope(raw);
      if (!parsed.token) {
        throw { message: 'Login response missing token', status: 500 };
      }
      return { type: 'success', response: parsed };
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (apiErr.status === 409 && apiErr.requires_tenant_selection && apiErr.memberships?.length) {
        return {
          type: 'tenant_selection',
          memberships: apiErr.memberships,
          user: {
            name: apiErr.user?.name || payload.email,
            email: apiErr.user?.email || payload.email,
            role: apiErr.user?.role || guardToRole[payload.guard || 'parent'] || 'parent',
          },
        };
      }
      throw err;
    }
  },

  async switchTenant(membershipId: number, guard?: string): Promise<LoginResponse> {
    const raw = await apiClient.post<unknown>('/auth/switch-tenant', {
      membership_id: membershipId,
      guard,
    }, false);
    return extractAuthEnvelope(raw);
  },

  async logout(): Promise<void> {
    if (USE_MOCK) return;
    return apiClient.post(AUTH_LOGOUT_ENDPOINT, undefined, false);
  },

  async getUser(): Promise<User> {
    if (USE_MOCK) {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : mockUser;
    }
    const raw = await apiClient.get<unknown>(AUTH_ME_ENDPOINT, undefined, false);
    const body = (raw && typeof raw === 'object' ? raw : {}) as UnknownObject;
    const userRaw = body.user || (body.data && typeof body.data === 'object' ? (body.data as UnknownObject).user : undefined) || raw;
    return normalizeUser(userRaw);
  },
};
