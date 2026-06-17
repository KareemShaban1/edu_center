import { apiClient, USE_MOCK } from '../api-client';
import type { CenterScopedRow } from '@/types/models';

export interface ParentBootstrapPayload {
  children: Array<CenterScopedRow & {
    id: number;
    name: string;
    grade: string;
    class: string;
    section: string;
  }>;
  attendance: Array<CenterScopedRow & {
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    status: 'present' | 'absent' | 'late';
  }>;
  fees: Array<CenterScopedRow & {
    id: number;
    student_id: number;
    student_name: string;
    item: string;
    amount: number;
    status: 'paid' | 'unpaid' | 'pending';
    due_date: string;
    month?: string;
  }>;
  quizzes: Array<CenterScopedRow & {
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    degree?: number | null;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
    grade?: string;
  }>;
  exams: Array<CenterScopedRow & {
    id: number;
    student_id: number;
    student_name: string;
    date: string;
    degree?: number | null;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
    grade?: string;
  }>;
  reports: Array<CenterScopedRow & {
    student_id: number;
    student_name: string;
    grade: string;
    attendance_rate: number;
    quiz_average?: number | null;
    exam_average?: number | null;
    paid_amount: number;
    pending_amount: number;
  }>;
  centers?: Array<{ center_id: string; center_name: string; center_slug?: string }>;
}

export const parentApi = {
  async bootstrap(): Promise<ParentBootstrapPayload> {
    if (USE_MOCK) {
      return { children: [], attendance: [], fees: [], quizzes: [], exams: [], reports: [] };
    }
    return apiClient.get<ParentBootstrapPayload>('/parent/bootstrap', undefined, false);
  },
};
