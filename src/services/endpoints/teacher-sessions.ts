import { apiClient, USE_MOCK } from '../api-client';
import type {
  AdminSessionRow,
  AdminSessionSavePayload,
} from './admin-sessions';

export type TeacherSessionRow = AdminSessionRow;
export type TeacherSessionSavePayload = AdminSessionSavePayload;

export const teacherSessionsApi = {
  async list(): Promise<{ sessions: TeacherSessionRow[] }> {
    if (USE_MOCK) return { sessions: [] };
    return apiClient.get('/teacher/sessions', undefined, false);
  },

  async update(id: number, payload: TeacherSessionSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.put(`/teacher/sessions/${id}`, payload, false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/teacher/sessions/${id}`, false);
  },

  async getLiveKitToken(sessionId: number): Promise<{ token: string; url: string; room: string }> {
    return apiClient.get(`/teacher/sessions/${sessionId}/livekit-token`, undefined, false);
  },
};
