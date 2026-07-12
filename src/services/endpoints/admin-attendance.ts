import { apiClient, USE_MOCK } from '../api-client';
import type { SessionOption } from './session-types';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRowPayload {
  student_id: number;
  student_name: string;
  status: AttendanceStatus;
  notes: string;
  can_whatsapp?: boolean;
}

export interface AttendanceDayPayload {
  date: string;
  section: {
    id: number;
    grade_id: number;
    class_id: number;
  };
  session_id?: number | null;
  session_options?: SessionOption[];
  rows: AttendanceRowPayload[];
}

export interface AttendanceHistoryDay {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
}

interface AttendanceHistoryPayload {
  section: {
    id: number;
    grade_id: number;
    class_id: number;
  };
  days: AttendanceHistoryDay[];
}

export const adminAttendanceApi = {
  async getSectionDate(sectionId: number, date: string, sessionId?: number | null): Promise<AttendanceDayPayload> {
    if (USE_MOCK) {
      return {
        date,
        section: { id: sectionId, grade_id: 0, class_id: 0 },
        session_id: sessionId ?? null,
        session_options: [],
        rows: [],
      };
    }
    const params = sessionId && sessionId > 0 ? { session_id: sessionId } : undefined;
    return apiClient.get<AttendanceDayPayload>(`/admin/attendance/section/${sectionId}/date/${date}`, params, false);
  },

  async getSectionHistory(sectionId: number): Promise<AttendanceHistoryPayload> {
    if (USE_MOCK) {
      return { section: { id: sectionId, grade_id: 0, class_id: 0 }, days: [] };
    }
    return apiClient.get<AttendanceHistoryPayload>(`/admin/attendance/section/${sectionId}/history`, undefined, false);
  },

  async saveSectionDate(
    sectionId: number,
    date: string,
    rows: Array<Pick<AttendanceRowPayload, 'student_id' | 'status' | 'notes'>>,
    sessionId?: number | null,
  ): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post(
      `/admin/attendance/section/${sectionId}/date/${date}`,
      { rows, session_id: sessionId && sessionId > 0 ? sessionId : null },
      false,
    );
  },
};
