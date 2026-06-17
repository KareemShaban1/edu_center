import { apiClient, USE_MOCK } from '../api-client';
import type { ActivityLog, Subscription, Tenant, TenantCreatePayload, TenantCreateResponse, User } from '@/types/models';
import {
  BRANDING_STORAGE_KEY,
  DEFAULT_APP_BRANDING,
  normalizeBranding,
  type AppBranding,
} from '@/lib/branding';

let mockTenants: Tenant[] = [
  {
    id: 1,
    name: 'Al-Noor Academy',
    domain: 'alnoor.edu',
    slug: 'alnoor',
    database: 'tenant_alnoor',
    plan: 'Pro',
    users_count: 12,
    teachers_count: 28,
    students_count: 380,
    parents_count: 210,
    subscription_status: 'active',
    status: 'active',
    created_at: '2023-06-15',
  },
  {
    id: 2,
    name: 'Future School',
    domain: 'future.edu',
    slug: 'future',
    database: 'tenant_future',
    plan: 'Business',
    users_count: 320,
    subscription_status: 'active',
    status: 'active',
    created_at: '2023-08-01',
  },
  {
    id: 3,
    name: 'Bright Minds',
    domain: 'bright.edu',
    slug: 'bright',
    database: 'tenant_bright',
    plan: 'Starter',
    users_count: 6,
    teachers_count: 15,
    students_count: 240,
    parents_count: 155,
    subscription_status: 'trial',
    status: 'active',
    created_at: '2023-09-10',
  },
];

let mockPlatformUsers: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@alnoor.edu', role: 'admin', tenant_id: 1, tenant_name: 'Al-Noor Academy', locale: 'en', created_at: '2024-01-01' },
  { id: 2, name: 'John Teacher', email: 'john@alnoor.edu', role: 'teacher', tenant_id: 1, tenant_name: 'Al-Noor Academy', locale: 'en', created_at: '2024-01-02' },
  { id: 3, name: 'Parent One', email: 'parent@future.edu', role: 'parent', tenant_id: 2, tenant_name: 'Future School', locale: 'en', created_at: '2024-01-03' },
  { id: 4, name: 'Student Demo', email: 'student@bright.edu', role: 'student', tenant_id: 3, tenant_name: 'Bright Minds', locale: 'en', created_at: '2024-01-04' },
  { id: 5, name: 'Super Admin', email: 'super@platform.com', role: 'super_admin', tenant_id: null, tenant_name: 'Platform', locale: 'en', created_at: '2024-01-05' },
];

let mockSubscriptions: Subscription[] = [
  {
    id: 1,
    tenant_id: 1,
    tenant_name: 'Al-Noor Academy',
    plan: 'Pro',
    amount: 499,
    billing_cycle: 'monthly',
    status: 'active',
    next_billing_date: '2026-04-01',
  },
  {
    id: 2,
    tenant_id: 2,
    tenant_name: 'Future School',
    plan: 'Business',
    amount: 899,
    billing_cycle: 'monthly',
    status: 'active',
    next_billing_date: '2026-04-07',
  },
  {
    id: 3,
    tenant_id: 3,
    tenant_name: 'Bright Minds',
    plan: 'Starter',
    amount: 199,
    billing_cycle: 'monthly',
    status: 'trial',
    next_billing_date: '2026-03-28',
  },
];

let mockLogs: ActivityLog[] = [
  { id: 1, description: 'Created tenant Al-Noor Academy', causer_id: 5, created_at: '2026-03-10' },
  { id: 2, description: 'Upgraded Future School subscription', causer_id: 5, created_at: '2026-03-11' },
  { id: 3, description: 'Suspended tenant Bright Minds', causer_id: 5, created_at: '2026-03-12' },
  { id: 4, description: 'Invited admin user for Al-Noor Academy', causer_id: 5, created_at: '2026-03-12' },
  { id: 5, description: 'Re-activated tenant Bright Minds', causer_id: 5, created_at: '2026-03-13' },
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const platformApi = {
  async listTenants(): Promise<Tenant[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [...mockTenants];
    }
    return apiClient.get<Tenant[]>('/platform/tenants', undefined, false);
  },

  async saveTenant(payload: TenantCreatePayload): Promise<TenantCreateResponse> {
    if (USE_MOCK) {
      await sleep(200);
      if (payload.id) {
        mockTenants = mockTenants.map(t => (t.id === payload.id ? { ...t, ...payload } : t));
        return mockTenants.find(t => t.id === payload.id)!;
      }
      const slug = payload.slug || payload.name?.toLowerCase().replace(/\s+/g, '-') || 'tenant';
      const created: TenantCreateResponse = {
        id: slug,
        name: payload.name || 'New Tenant',
        domain: payload.domain || 'tenant.example.com',
        slug,
        status: (payload.status as Tenant['status']) || 'active',
        plan: payload.plan || 'Starter',
        users_count: payload.seed_default_accounts === false ? 0 : 1,
        teachers_count: (payload.seed_default_accounts === false ? 0 : 1) + (payload.initial_users?.teachers?.length ?? 0),
        students_count: payload.seed_default_accounts === false ? 0 : 1,
        parents_count: payload.seed_default_accounts === false ? 0 : 1,
        database: payload.database || `tenant_${Date.now()}`,
        subscription_status: 'trial',
        created_at: new Date().toISOString().slice(0, 10),
        default_accounts: payload.seed_default_accounts === false ? [] : [
          { role: 'admin', name: 'Center Admin', email: `admin-${slug}@educenter.com`, password: 'password' },
          { role: 'teacher', name: 'Default Teacher', email: `teacher-${slug}@educenter.com`, password: 'password' },
          { role: 'parent', name: 'Default Parent', email: `parent-${slug}@educenter.com`, password: 'password' },
          { role: 'student', name: 'Default Student', email: `student-${slug}@educenter.com`, password: 'password' },
          ...(payload.initial_users?.teachers?.map(t => ({
            role: 'teacher',
            name: t.name,
            email: t.email,
            password: t.password || 'password',
          })) ?? []),
        ],
      };
      mockTenants = [created, ...mockTenants];
      return created;
    }

    if (payload.id) {
      return apiClient.put<TenantCreateResponse>(`/platform/tenants/${payload.id}`, payload, false);
    }
    return apiClient.post<TenantCreateResponse>('/platform/tenants', payload, false);
  },

  async deleteTenant(id: number | string): Promise<void> {
    if (USE_MOCK) {
      await sleep(200);
      mockTenants = mockTenants.filter(t => t.id !== id);
      return;
    }
    return apiClient.delete<void>(`/platform/tenants/${id}`, false);
  },

  async listUsers(): Promise<User[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [...mockPlatformUsers];
    }
    return apiClient.get<User[]>('/platform/users', undefined, false);
  },

  async saveUser(payload: Partial<User> & { id?: number; password?: string }): Promise<User> {
    if (USE_MOCK) {
      await sleep(200);
      if (payload.id) {
        mockPlatformUsers = mockPlatformUsers.map(u => (u.id === payload.id ? { ...u, ...payload } as User : u));
        return mockPlatformUsers.find(u => u.id === payload.id)!;
      }
      const created: User = {
        id: Date.now(),
        name: payload.name || 'Platform User',
        email: payload.email || `user${Date.now()}@platform.local`,
        role: (payload.role || 'platform_admin') as User['role'],
        tenant_id: null,
        tenant_name: 'Platform',
        locale: 'en',
        created_at: new Date().toISOString().slice(0, 10),
      };
      mockPlatformUsers = [created, ...mockPlatformUsers];
      return created;
    }
    if (payload.id) {
      return apiClient.put<User>(`/platform/users/${payload.id}`, payload, false);
    }
    return apiClient.post<User>('/platform/users', payload, false);
  },

  async deleteUser(id: number): Promise<void> {
    if (USE_MOCK) {
      await sleep(200);
      mockPlatformUsers = mockPlatformUsers.filter(u => u.id !== id);
      return;
    }
    return apiClient.delete<void>(`/platform/users/${id}`, false);
  },

  async listSubscriptions(): Promise<Subscription[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [...mockSubscriptions];
    }
    return apiClient.get<Subscription[]>('/platform/subscriptions', undefined, false);
  },

  async saveSubscription(payload: Partial<Subscription> & { id?: number }): Promise<Subscription> {
    if (USE_MOCK) {
      await sleep(200);
      if (payload.id) {
        mockSubscriptions = mockSubscriptions.map(s => (s.id === payload.id ? { ...s, ...payload } as Subscription : s));
        return mockSubscriptions.find(s => s.id === payload.id)!;
      }

      const tenant = mockTenants.find(t => t.id === payload.tenant_id);
      const created: Subscription = {
        id: Date.now(),
        tenant_id: payload.tenant_id || 0,
        tenant_name: tenant?.name || payload.tenant_name || 'Tenant',
        plan: payload.plan || 'Starter',
        amount: Number(payload.amount || 0),
        billing_cycle: payload.billing_cycle || 'monthly',
        status: payload.status || 'trial',
        next_billing_date: payload.next_billing_date || new Date().toISOString().slice(0, 10),
      };
      mockSubscriptions = [created, ...mockSubscriptions];
      return created;
    }

    if (payload.id) {
      return apiClient.put<Subscription>(`/platform/subscriptions/${payload.id}`, payload, false);
    }
    return apiClient.post<Subscription>('/platform/subscriptions', payload, false);
  },

  async deleteSubscription(id: number): Promise<void> {
    if (USE_MOCK) {
      await sleep(200);
      mockSubscriptions = mockSubscriptions.filter(s => s.id !== id);
      return;
    }
    return apiClient.delete<void>(`/platform/subscriptions/${id}`, false);
  },

  async listRoles(): Promise<{ roles: Array<{ id: number; name: string; guard: string; permissions: number; users: number }>; can_manage: boolean }> {
    if (USE_MOCK) {
      await sleep(200);
      return {
        roles: [
          { id: 1, name: 'platform_admin', guard: 'platform_admin', permissions: 0, users: mockPlatformUsers.length },
          { id: 2, name: 'admin', guard: 'web', permissions: 0, users: 0 },
          { id: 3, name: 'teacher', guard: 'teacher', permissions: 0, users: 0 },
          { id: 4, name: 'student', guard: 'student', permissions: 0, users: 0 },
          { id: 5, name: 'parent', guard: 'parent', permissions: 0, users: 0 },
        ],
        can_manage: false,
      };
    }
    return apiClient.get<{ roles: Array<{ id: number; name: string; guard: string; permissions: number; users: number }>; can_manage: boolean }>('/platform/roles', undefined, false);
  },

  async listActivityLogs(): Promise<ActivityLog[]> {
    if (USE_MOCK) {
      await sleep(250);
      return [...mockLogs];
    }
    return apiClient.get<ActivityLog[]>('/platform/activity-logs', undefined, false);
  },

  async getBranding(): Promise<AppBranding> {
    if (USE_MOCK) {
      await sleep(150);
      try {
        const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
        return normalizeBranding(raw ? JSON.parse(raw) : DEFAULT_APP_BRANDING);
      } catch {
        return { ...DEFAULT_APP_BRANDING };
      }
    }
    return apiClient.get<AppBranding>('/branding', undefined, false);
  },

  async saveBranding(payload: AppBranding): Promise<AppBranding> {
    const normalized = normalizeBranding(payload);
    if (USE_MOCK) {
      await sleep(200);
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
    return apiClient.put<AppBranding>('/platform/branding', normalized, false);
  },
};
