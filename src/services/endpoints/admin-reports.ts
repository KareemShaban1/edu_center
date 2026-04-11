import { apiClient, USE_MOCK } from '../api-client';

export interface AdminReportsPayload {
  stats: {
    students: number;
    teachers: number;
    parents: number;
    grades: number;
    classes: number;
    sections: number;
    attendance_rate: number;
    fees_total: number;
    payments_count: number;
    collected_amount: number;
    unpaid_count: number;
    exam_records: number;
    quiz_records: number;
    library_items: number;
    announcements: number;
  };
  attendance_by_grade: Array<{
    grade_id: number;
    grade_name: string;
    rate: number;
    total: number;
  }>;
  revenue_breakdown: Array<{
    type: string;
    collected: number;
  }>;
  available_reports: Array<{
    key: string;
    title: string;
    count: number;
  }>;
}

export const adminReportsApi = {
  async get(): Promise<AdminReportsPayload> {
    if (USE_MOCK) {
      return {
        stats: {
          students: 0, teachers: 0, parents: 0, grades: 0, classes: 0, sections: 0,
          attendance_rate: 0, fees_total: 0, payments_count: 0, collected_amount: 0,
          unpaid_count: 0, exam_records: 0, quiz_records: 0, library_items: 0, announcements: 0,
        },
        attendance_by_grade: [],
        revenue_breakdown: [],
        available_reports: [],
      };
    }
    return apiClient.get<AdminReportsPayload>('/admin/reports', undefined, false);
  },
};

