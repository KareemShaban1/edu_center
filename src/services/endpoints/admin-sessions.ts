import { apiClient, USE_MOCK } from '../api-client';
import type { SessionOnlineProvider, SessionType } from './session-types';

export type { SessionOnlineProvider, SessionType } from './session-types';

export interface AdminSessionRow {
  id: number;
  grade_id: number;
  class_id: number;
  section_id: number;
  section_label: string;
  topic: string;
  start_at: string;
  duration: number;
  session_type: SessionType;
  provider?: SessionOnlineProvider | null;
  room_slug?: string | null;
  join_url?: string | null;
  moderator_url?: string | null;
  password?: string | null;
  record_enabled?: boolean;
  external_ref?: string | null;
  created_by: string;
  location?: string;
  notes?: string;
}

export interface AdminSessionSavePayload {
  section_id: number;
  topic: string;
  start_at: string;
  duration: number;
  session_type?: SessionType;
  provider?: SessionOnlineProvider | 'offline';
  join_url?: string;
  moderator_url?: string;
  password?: string;
  external_ref?: string;
  location?: string;
  notes?: string;
  record_enabled?: boolean;
}

export interface SessionLinkedRecord {
  student_id: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes: string;
}

export interface SessionAssessmentRecord extends SessionLinkedRecord {
  degree: string;
}

export interface SessionLinkedSummary {
  total: number;
  present?: number;
  absent?: number;
  late?: number;
  records: SessionLinkedRecord[] | SessionAssessmentRecord[];
}

export interface SectionSessionOverview {
  id: number;
  topic: string;
  start_at: string;
  duration: number;
  session_type: SessionType;
  provider?: SessionOnlineProvider | null;
  join_url?: string | null;
  location?: string;
  notes?: string;
  created_by: string;
  attendance: SessionLinkedSummary;
  exams: { total: number; records: SessionAssessmentRecord[] };
  quizzes: { total: number; records: SessionAssessmentRecord[] };
}

export interface SectionSessionsOverview {
  section: {
    id: number;
    name: string;
    grade_id: number;
    class_id: number;
    grade_name: string;
    class_name: string;
  };
  sessions: SectionSessionOverview[];
}

export const adminSessionsApi = {
  async list(): Promise<{ sessions: AdminSessionRow[] }> {
    if (USE_MOCK) return { sessions: [] };
    return apiClient.get('/admin/sessions', undefined, false);
  },

  async getSectionOverview(sectionId: number): Promise<SectionSessionsOverview> {
    if (USE_MOCK) {
      return {
        section: { id: sectionId, name: '', grade_id: 0, class_id: 0, grade_name: '', class_name: '' },
        sessions: [],
      };
    }
    return apiClient.get(`/admin/sections/${sectionId}/sessions`, undefined, false);
  },

  async create(payload: AdminSessionSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post('/admin/sessions', payload, false);
  },

  async update(id: number, payload: AdminSessionSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.put(`/admin/sessions/${id}`, payload, false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/sessions/${id}`, false);
  },

  async generate(payload?: { force?: boolean; days_ahead?: number }): Promise<{
    message: string;
    generation: { created: number; skipped: number; sections: number; enabled: boolean };
  }> {
    if (USE_MOCK) {
      return { message: 'Generated', generation: { created: 0, skipped: 0, sections: 0, enabled: true } };
    }
    return apiClient.post('/admin/sessions/generate', payload ?? {}, false);
  },
};
