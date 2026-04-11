import { apiClient, USE_MOCK } from '../api-client';
import type { Fee } from '@/types/models';

export type FeePayload = Pick<Fee, 'title' | 'amount' | 'grade_id' | 'classroom_id' | 'section_id' | 'description' | 'year' | 'month' | 'type'>;

interface FeeEnvelope {
  fee: Fee;
}

export const adminFeesApi = {
  async create(payload: FeePayload): Promise<Fee> {
    if (USE_MOCK) return { id: Date.now(), ...payload, year: payload.year || '' } as Fee;
    const res = await apiClient.post<FeeEnvelope>('/admin/fees', payload, false);
    return res.fee;
  },
  async update(id: number, payload: FeePayload): Promise<Fee> {
    if (USE_MOCK) return { id, ...payload, year: payload.year || '' } as Fee;
    const res = await apiClient.put<FeeEnvelope>(`/admin/fees/${id}`, payload, false);
    return res.fee;
  },
  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/fees/${id}`, false);
  },
};

