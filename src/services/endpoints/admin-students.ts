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

export interface AdminStudentDetails {
  student: Student & { phone?: string; class_name?: string };
  parent: { id: number; name: string; email: string; phone: string } | null;
  summary: {
    attendance_total: number;
    attendance_present: number;
    attendance_rate: number;
    exams_count: number;
    exams_avg: number | null;
    quizzes_count: number;
    quizzes_avg: number | null;
    homework_total: number;
    homework_submitted: number;
    payments_paid: number;
    payments_unpaid: number;
    payments_paid_amount: number;
    payments_unpaid_amount: number;
    certifications_count: number;
    notifications_count: number;
    announcements_count: number;
    sessions_count: number;
  };
  attendance: Array<{ id: number; date: string; status: string; notes: string }>;
  exams: Array<{
    id: number;
    date: string;
    score: number | null;
    total: number;
    attendance_status: string;
    notes: string;
    session_id: number | null;
  }>;
  quizzes: Array<{
    id: number;
    date: string;
    score: number | null;
    total: number;
    attendance_status: string;
    notes: string;
    session_id: number | null;
  }>;
  homework: Array<{
    id: number | string;
    submission_id: number | null;
    homework_id: number;
    title: string;
    due_date: string;
    status: string;
    grade: number | string | null;
    student_notes: string;
    response: string;
    file_url: string | null;
    file_name: string | null;
    correction_url: string | null;
    correction_name: string | null;
    upload_date: string;
  }>;
  payments: Array<{
    id: number;
    item: string;
    amount: number;
    status: string;
    due_date: string;
    month: string;
  }>;
  certifications: Array<{
    id: number;
    template_id: number | null;
    title: string;
    context: string;
    context_date: string | null;
    issued_at: string | null;
    is_custom: boolean;
  }>;
  announcements: Array<{
    id: number;
    title: string;
    content: string;
    time: string | null;
    type: string;
    created_at: string | null;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    channel_type: string;
    read_at: string | null;
    created_at: string | null;
  }>;
  sessions: Array<{
    id: number;
    topic: string;
    teacher: string;
    start_at: string;
    duration: number;
    provider: string;
    location: string;
    notes: string;
  }>;
}

export const adminStudentsApi = {
  async getDetails(id: number): Promise<AdminStudentDetails> {
    if (USE_MOCK) {
      const found = mockStudents.find(s => s.id === id) ?? mockStudents[0];
      return {
        student: { ...found, phone: '' },
        parent: null,
        summary: {
          attendance_total: 0,
          attendance_present: 0,
          attendance_rate: 0,
          exams_count: 0,
          exams_avg: null,
          quizzes_count: 0,
          quizzes_avg: null,
          homework_total: 0,
          homework_submitted: 0,
          payments_paid: 0,
          payments_unpaid: 0,
          payments_paid_amount: 0,
          payments_unpaid_amount: 0,
          certifications_count: 0,
          notifications_count: 0,
          announcements_count: 0,
          sessions_count: 0,
        },
        attendance: [],
        exams: [],
        quizzes: [],
        homework: [],
        payments: [],
        certifications: [],
        announcements: [],
        notifications: [],
        sessions: [],
      };
    }
    return apiClient.get<AdminStudentDetails>(`/admin/students/${id}`, undefined, false);
  },

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
