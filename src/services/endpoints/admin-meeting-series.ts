import { apiClient, USE_MOCK } from '../api-client';
import type { MeetingSeriesProvider } from './teacher-meeting-series';

export interface AdminMeetingSeriesTeacher {
  id: number;
  name: string;
  email: string;
}

export interface AdminMeetingSeriesSection {
  id: number;
  name: string;
}

export interface AdminMeetingSeriesRow {
  id: number;
  topic: string;
  provider: MeetingSeriesProvider;
  teacher_id: number;
  teacher_name: string;
  section_id: number;
  section_name: string;
  week_days: number[];
  start_date: string;
  end_date: string | null;
  start_time: string;
  duration: number;
  record_enabled: boolean;
  location: string;
  notes: string;
}

export interface AdminMeetingSeriesPayload {
  teacher_id: number;
  section_id: number;
  topic: string;
  provider: MeetingSeriesProvider;
  week_days: number[];
  start_date: string;
  end_date?: string | null;
  start_time: string;
  duration: number;
  record_enabled?: boolean;
  generate_value?: number;
  generate_unit?: 'weeks' | 'months';
  join_url?: string;
  moderator_url?: string;
  password?: string;
  external_ref?: string;
  location?: string;
  notes?: string;
}

export const adminMeetingSeriesApi = {
  async list(): Promise<{
    series: AdminMeetingSeriesRow[];
    teachers: AdminMeetingSeriesTeacher[];
    sections_by_teacher: Record<string, AdminMeetingSeriesSection[]>;
  }> {
    if (USE_MOCK) return { series: [], teachers: [], sections_by_teacher: {} };
    return apiClient.get('/admin/meeting-series', undefined, false);
  },

  async create(payload: AdminMeetingSeriesPayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post('/admin/meeting-series', payload, false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/meeting-series/${id}`, false);
  },
};

