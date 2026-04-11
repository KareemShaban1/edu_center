import { apiClient, USE_MOCK } from '../api-client';
import type { Teacher } from '@/types/models';
import { mockTeachers } from '../mock-data';

export interface TeacherSavePayload {
  name: string;
  email: string;
  password?: string;
  specialization?: string;
  phone: string;
  gender: string;
  status?: 'active' | 'inactive';
  class_ids: number[];
}

interface TeacherEnvelope {
  teacher: Teacher;
}

export const adminTeachersApi = {
  async create(payload: TeacherSavePayload): Promise<Teacher> {
    if (USE_MOCK) {
      return {
        ...mockTeachers[0],
        ...payload,
        id: Date.now(),
      };
    }
    const res = await apiClient.post<TeacherEnvelope>('/admin/teachers', payload, false);
    return res.teacher;
  },

  async update(id: number, payload: TeacherSavePayload): Promise<Teacher> {
    if (USE_MOCK) {
      return {
        ...mockTeachers[0],
        ...payload,
        id,
      };
    }
    const res = await apiClient.put<TeacherEnvelope>(`/admin/teachers/${id}`, payload, false);
    return res.teacher;
  },
};

