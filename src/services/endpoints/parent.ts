import { apiClient, USE_MOCK } from '../api-client';

export interface ParentBootstrapPayload {
  children: Array<{
    id: number;
    name: string;
    grade: string;
    class: string;
    section: string;
  }>;
  attendance: Array<{
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    status: 'present' | 'absent' | 'late';
  }>;
  fees: Array<{
    id: number;
    student_id: number;
    student_name: string;
    item: string;
    amount: number;
    status: 'paid' | 'unpaid' | 'pending';
    due_date: string;
    month?: string;
  }>;
  quizzes: Array<{
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    degree?: number | null;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
    grade?: string;
  }>;
  exams: Array<{
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    degree?: number | null;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
    grade?: string;
  }>;
  reports: Array<{
    student_id: number;
    student_name: string;
    grade: string;
    attendance_rate: number;
    quiz_average?: number | null;
    exam_average?: number | null;
    paid_amount: number;
    pending_amount: number;
  }>;
}

export const parentApi = {
  async bootstrap(): Promise<ParentBootstrapPayload> {
    if (USE_MOCK) {
      return { children: [], attendance: [], fees: [], quizzes: [], exams: [], reports: [] };
    }
    return apiClient.get<ParentBootstrapPayload>('/parent/bootstrap', undefined, false);
  },
};

