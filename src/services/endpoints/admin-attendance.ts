import { apiClient, USE_MOCK } from '../api-client';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRowPayload {
  student_id: number;
  student_name: string;
  status: AttendanceStatus;
  notes: string;
}

export interface AttendanceDayPayload {
  date: string;
  section: {
    id: number;
    grade_id: number;
    class_id: number;
  };
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
  async getSectionDate(sectionId: number, date: string): Promise<AttendanceDayPayload> {
    if (USE_MOCK) {
      return {
        date,
        section: { id: sectionId, grade_id: 0, class_id: 0 },
        rows: [],
      };
    }
    return apiClient.get<AttendanceDayPayload>(`/admin/attendance/section/${sectionId}/date/${date}`, undefined, false);
  },

  async getSectionHistory(sectionId: number): Promise<AttendanceHistoryPayload> {
    if (USE_MOCK) {
      return { section: { id: sectionId, grade_id: 0, class_id: 0 }, days: [] };
    }
    return apiClient.get<AttendanceHistoryPayload>(`/admin/attendance/section/${sectionId}/history`, undefined, false);
  },

  async saveSectionDate(sectionId: number, date: string, rows: Array<Pick<AttendanceRowPayload, 'student_id' | 'status' | 'notes'>>): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post(`/admin/attendance/section/${sectionId}/date/${date}`, { rows }, false);
  },
};

