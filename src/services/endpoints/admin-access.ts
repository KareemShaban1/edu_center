import { apiClient, USE_MOCK } from '../api-client';

export interface AdminUserItem {
  id: number;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface AdminUserSavePayload {
  name: string;
  phone?: string;
  email: string;
  password?: string;
  role: string;
  status: 'active' | 'inactive';
}

export interface AdminRoleItem {
  id: number;
  name: string;
  guard_name: string;
  description?: string;
  permissions: string[];
  users_count: number;
}

export interface AdminRoleSavePayload {
  name: string;
  description?: string;
  guard_name?: string;
  permissions: string[];
}

export const adminAccessApi = {
  async listUsers(): Promise<AdminUserItem[]> {
    if (USE_MOCK) return [];
    const res = await apiClient.get<{ users: AdminUserItem[] }>('/admin/users', undefined, false);
    return res.users || [];
  },

  async createUser(payload: AdminUserSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post('/admin/users', payload, false);
  },

  async updateUser(id: number, payload: AdminUserSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.put(`/admin/users/${id}`, payload, false);
  },

  async deleteUser(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/users/${id}`, false);
  },

  async listRoles(): Promise<{ roles: AdminRoleItem[]; permissions: string[] }> {
    if (USE_MOCK) return { roles: [], permissions: [] };
    return apiClient.get<{ roles: AdminRoleItem[]; permissions: string[] }>('/admin/roles', undefined, false);
  },

  async createRole(payload: AdminRoleSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post('/admin/roles', payload, false);
  },

  async updateRole(id: number, payload: AdminRoleSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.put(`/admin/roles/${id}`, payload, false);
  },

  async deleteRole(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/roles/${id}`, false);
  },
};

