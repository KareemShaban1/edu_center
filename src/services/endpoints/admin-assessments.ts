import { apiClient, USE_MOCK } from '../api-client';

export interface AssessmentRow {
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  degree: string;
  notes: string;
}

export interface AssessmentDayPayload {
  date: string;
  section: { id: number; grade_id: number; class_id: number };
  rows: AssessmentRow[];
}

export interface AssessmentHistoryDay {
  date: string;
  exam_name?: string;
  quiz_name?: string;
  students_count: number;
}

export const adminAssessmentsApi = {
  async getExamDate(sectionId: number, date: string): Promise<AssessmentDayPayload> {
    if (USE_MOCK) return { date, section: { id: sectionId, grade_id: 0, class_id: 0 }, rows: [] };
    return apiClient.get<AssessmentDayPayload>(`/admin/exams/section/${sectionId}/date/${date}`, undefined, false);
  },
  async saveExamDate(sectionId: number, date: string, rows: Array<Pick<AssessmentRow, 'student_id' | 'status' | 'degree' | 'notes'>>): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post(`/admin/exams/section/${sectionId}/date/${date}`, { rows }, false);
  },
  async getExamHistory(sectionId: number): Promise<{ days: AssessmentHistoryDay[] }> {
    if (USE_MOCK) return { days: [] };
    return apiClient.get<{ days: AssessmentHistoryDay[] }>(`/admin/exams/section/${sectionId}/history`, undefined, false);
  },

  async getQuizDate(sectionId: number, date: string): Promise<AssessmentDayPayload> {
    if (USE_MOCK) return { date, section: { id: sectionId, grade_id: 0, class_id: 0 }, rows: [] };
    return apiClient.get<AssessmentDayPayload>(`/admin/quizzes/section/${sectionId}/date/${date}`, undefined, false);
  },
  async saveQuizDate(sectionId: number, date: string, rows: Array<Pick<AssessmentRow, 'student_id' | 'status' | 'degree' | 'notes'>>): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post(`/admin/quizzes/section/${sectionId}/date/${date}`, { rows }, false);
  },
  async getQuizHistory(sectionId: number): Promise<{ days: AssessmentHistoryDay[] }> {
    if (USE_MOCK) return { days: [] };
    return apiClient.get<{ days: AssessmentHistoryDay[] }>(`/admin/quizzes/section/${sectionId}/history`, undefined, false);
  },
};

