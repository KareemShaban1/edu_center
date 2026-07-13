import { apiClient, USE_MOCK } from '../api-client';

export type AdminReportType = 'attendance' | 'exams' | 'quizzes' | 'payments';

export const ADMIN_REPORT_TYPES: AdminReportType[] = ['attendance', 'exams', 'quizzes', 'payments'];

export interface AdminReportStat {
  key: string;
  value: number;
}

export interface AdminReportGradeRow {
  grade_id?: number;
  grade_name: string;
  total: number;
  rate: number;
}

export interface AdminReportRecentRow {
  id: number;
  student_name: string;
  grade_name: string;
  class_name?: string;
  section_name?: string;
  date: string;
  degree?: string;
  status: string;
}

export interface AdminPaymentsUnpaidStudent {
  id: number | string;
  student_name: string;
  grade_name: string;
  class_name: string;
  section_name: string;
  deserved_months: string[];
  unpaid_amount: number;
  fee_title?: string | null;
}

export interface AdminPaymentsReportFilters {
  grade_id?: number;
  class_id?: number;
  section_id?: number;
  date?: string;
}

export interface AdminPaymentsReportPayload extends AdminTypedReportPayload {
  by_fee_type: Array<{
    type: string;
    label: string;
    collected: number;
    unpaid: number;
    total: number;
  }>;
  by_month: Array<{
    month: string;
    collected: number;
    unpaid: number;
  }>;
  paid_vs_unpaid: {
    paid_count: number;
    unpaid_count: number;
    paid_amount: number;
    unpaid_amount: number;
  };
  unpaid_students: AdminPaymentsUnpaidStudent[];
  unpaid_mode: 'date' | 'deserved_months';
  reference_month?: string | null;
  filters: AdminPaymentsReportFilters;
}

export interface AdminTypedReportPayload {
  type: AdminReportType;
  stats: AdminReportStat[];
  by_grade: AdminReportGradeRow[];
  recent: AdminReportRecentRow[];
}

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

  async getByType(type: AdminReportType, filters?: AdminPaymentsReportFilters): Promise<AdminTypedReportPayload | AdminPaymentsReportPayload> {
    if (USE_MOCK) {
      if (type === 'payments') {
        return {
          type: 'payments',
          stats: [],
          by_grade: [],
          recent: [],
          by_fee_type: [],
          by_month: [],
          paid_vs_unpaid: { paid_count: 0, unpaid_count: 0, paid_amount: 0, unpaid_amount: 0 },
          unpaid_students: [],
          unpaid_mode: 'deserved_months',
          filters: filters || {},
        };
      }
      return { type, stats: [], by_grade: [], recent: [] };
    }
    const params: Record<string, string | number> = {};
    if (filters?.grade_id) params.grade_id = filters.grade_id;
    if (filters?.class_id) params.class_id = filters.class_id;
    if (filters?.section_id) params.section_id = filters.section_id;
    if (filters?.date) params.date = filters.date;
    return apiClient.get<AdminTypedReportPayload | AdminPaymentsReportPayload>(`/admin/reports/${type}`, params, false);
  },

  async getPayments(filters?: AdminPaymentsReportFilters): Promise<AdminPaymentsReportPayload> {
    const result = await this.getByType('payments', filters);
    return result as AdminPaymentsReportPayload;
  },
};
