import { apiClient, USE_MOCK } from '../api-client';
import type { Parent } from '@/types/models';
import { mockParents } from '../mock-data';

export interface ParentSavePayload {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  job_title?: string;
  status: 'active' | 'inactive';
  address?: string;
}

interface ParentEnvelope {
  parent: Parent;
}

export const adminParentsApi = {
  async create(payload: ParentSavePayload): Promise<Parent> {
    if (USE_MOCK) {
      return { ...mockParents[0], ...payload, id: Date.now() };
    }
    const res = await apiClient.post<ParentEnvelope>('/admin/parents', payload, false);
    return res.parent;
  },

  async update(id: number, payload: ParentSavePayload): Promise<Parent> {
    if (USE_MOCK) {
      return { ...mockParents[0], ...payload, id };
    }
    const res = await apiClient.put<ParentEnvelope>(`/admin/parents/${id}`, payload, false);
    return res.parent;
  },
};

