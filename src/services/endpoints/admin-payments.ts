import { apiClient, USE_MOCK } from '../api-client';

export interface PaymentFeeOption {
  id: number;
  title: string;
  amount: number;
  year?: string | null;
  month: string;
  type: string;
}

export interface PaymentRow {
  id?: number | null;
  student_id: number;
  student_name: string;
  payment_date: string;
  fee_id: number | null;
  payment_status: 'paid' | 'unpaid';
  month: string;
  amount: number;
  notes: string;
}

export interface PaymentDayPayload {
  date: string;
  selected_fee_id?: number | null;
  section: {
    id: number;
    grade_id: number;
    class_id: number;
  };
  fees: PaymentFeeOption[];
  rows: PaymentRow[];
}

export interface PaymentHistoryDay {
  date: string;
  paid: number;
  unpaid: number;
  total_amount: number;
  total: number;
}

export const adminPaymentsApi = {
  async getSectionDate(sectionId: number, date: string, feeId?: number | null): Promise<PaymentDayPayload> {
    if (USE_MOCK) {
      return {
        date,
        selected_fee_id: feeId ?? null,
        section: { id: sectionId, grade_id: 0, class_id: 0 },
        fees: [],
        rows: [],
      };
    }
    const params = feeId ? { fee_id: feeId } : undefined;
    return apiClient.get<PaymentDayPayload>(`/admin/payments/section/${sectionId}/date/${date}`, params, false);
  },

  async saveSectionDate(sectionId: number, date: string, rows: Array<Pick<PaymentRow, 'id' | 'student_id' | 'payment_date' | 'fee_id' | 'payment_status' | 'month' | 'amount' | 'notes'>>): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post(`/admin/payments/section/${sectionId}/date/${date}`, { rows }, false);
  },

  async getSectionHistory(sectionId: number): Promise<{ days: PaymentHistoryDay[] }> {
    if (USE_MOCK) return { days: [] };
    return apiClient.get<{ days: PaymentHistoryDay[] }>(`/admin/payments/section/${sectionId}/history`, undefined, false);
  },
};

