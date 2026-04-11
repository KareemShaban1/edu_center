import { apiClient, USE_MOCK } from '../api-client';
import type { Student } from '@/types/models';
import { mockStudents } from '../mock-data';

export interface StudentSavePayload {
  name: string;
  email: string;
  password?: string;
  gender: string;
  status: Student['status'];
  grade_id: number;
  classroom_id: number;
  section_id: number;
  parent_id?: number | null;
}

interface StudentEnvelope {
  student: Student;
}

export const adminStudentsApi = {
  async create(payload: StudentSavePayload): Promise<Student> {
    if (USE_MOCK) {
      return {
        ...mockStudents[0],
        ...payload,
        id: Date.now(),
        parent_id: payload.parent_id ?? undefined,
        created_at: new Date().toISOString().slice(0, 10),
      };
    }
    const res = await apiClient.post<StudentEnvelope>('/admin/students', payload, false);
    return res.student;
  },

  async update(id: number, payload: StudentSavePayload): Promise<Student> {
    if (USE_MOCK) {
      return {
        ...mockStudents[0],
        ...payload,
        id,
        parent_id: payload.parent_id ?? undefined,
      };
    }
    const res = await apiClient.put<StudentEnvelope>(`/admin/students/${id}`, payload, false);
    return res.student;
  },
};

