import { apiClient, USE_MOCK } from '../api-client';
import type {
  AdminMeetingRow,
  AdminMeetingSavePayload,
  AdminMeetingSeriesOption,
} from './admin-meetings';

export type TeacherMeetingRow = AdminMeetingRow;
export type TeacherMeetingSavePayload = AdminMeetingSavePayload;
export type TeacherMeetingSeriesOption = AdminMeetingSeriesOption;

export const teacherMeetingsApi = {
  async list(): Promise<{ meetings: TeacherMeetingRow[]; series_options: TeacherMeetingSeriesOption[] }> {
    if (USE_MOCK) return { meetings: [], series_options: [] };
    return apiClient.get('/teacher/meetings', undefined, false);
  },

  async update(id: number, payload: TeacherMeetingSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.put(`/teacher/meetings/${id}`, payload, false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/teacher/meetings/${id}`, false);
  },
};
