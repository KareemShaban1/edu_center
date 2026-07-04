import { apiClient, USE_MOCK } from '../api-client';
import type { Student } from '@/types/models';
import { mockStudents } from '../mock-data';

export interface StudentSavePayload {
  name: string;
  code: string;
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

  async assignToCenter(id: number): Promise<{ message: string; student_id: number; center_id: number }> {
    if (USE_MOCK) {
      return { message: 'Assigned', student_id: id, center_id: 1 };
    }
    return apiClient.post(`/admin/students/${id}/assign-center`, {}, false);
  },

  async unassignFromCenter(id: number): Promise<{ message: string; student_id: number; center_id: number; membership_status: string }> {
    if (USE_MOCK) {
      return { message: 'Unassigned', student_id: id, center_id: 1, membership_status: 'not_assigned' };
    }
    return apiClient.post(`/admin/students/${id}/unassign-center`, {}, false);
  },

  async searchByCode(code: string): Promise<{
    student: Student & { is_assigned: boolean };
    parent: { id: number; name: string; email: string; is_assigned: boolean } | null;
  }> {
    if (USE_MOCK) {
      const found = mockStudents.find(s => (s as Student & { code?: string }).code === code);
      if (!found) throw new Error('Student not found');
      return {
        student: { ...found, code, is_assigned: false },
        parent: null,
      };
    }
    return apiClient.get('/admin/students/search-by-code', { code }, false);
  },
};

