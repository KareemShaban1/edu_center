import { authApi } from '@/services/endpoints/auth';
import { apiClient } from '@/services/api-client';
import type { TenantMembershipOption } from '@/types/models';

const TOKEN_KEY = 'edu_developer_api_token';
const META_KEY = 'edu_developer_api_auth_meta';

export interface DeveloperApiAuthMeta {
  email: string;
  name: string;
  role: string;
  guard: string;
  tenantSlug?: string | null;
  tenantId?: number | null;
  savedAt: string;
}

export type DeveloperApiLoginResult =
  | { type: 'success'; meta: DeveloperApiAuthMeta }
  | { type: 'tenant_selection'; memberships: TenantMembershipOption[] };

export function getDeveloperApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getApiTestToken(): string | null {
  return getDeveloperApiToken() ?? apiClient.getToken();
}

export function getDeveloperApiAuthMeta(): DeveloperApiAuthMeta | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DeveloperApiAuthMeta;
  } catch {
    return null;
  }
}

export function saveDeveloperApiAuth(token: string, meta: Omit<DeveloperApiAuthMeta, 'savedAt'>): void {
  const full: DeveloperApiAuthMeta = { ...meta, savedAt: new Date().toISOString() };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(META_KEY, JSON.stringify(full));
}

export function clearDeveloperApiAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(META_KEY);
}

export function maskToken(token: string): string {
  if (token.length <= 12) return '••••••••';
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export async function loginDeveloperApiAuth(params: {
  email: string;
  password: string;
  guard: string;
  tenantSlug?: string;
  membershipId?: number;
}): Promise<DeveloperApiLoginResult> {
  const result = await authApi.login({
    email: params.email,
    password: params.password,
    guard: params.guard,
    tenantSlug: params.tenantSlug,
    membershipId: params.membershipId,
    portal: params.guard === 'parent' || params.guard === 'student',
  });

  if (result.type === 'tenant_selection') {
    return { type: 'tenant_selection', memberships: result.memberships };
  }

  const { user, token } = result.response;
  const meta: Omit<DeveloperApiAuthMeta, 'savedAt'> = {
    email: user.email,
    name: user.name,
    role: user.role,
    guard: params.guard,
    tenantSlug: user.tenant_slug ?? params.tenantSlug ?? null,
    tenantId: user.tenant_id ?? null,
  };
  saveDeveloperApiAuth(token, meta);
  return { type: 'success', meta: { ...meta, savedAt: new Date().toISOString() } };
}
