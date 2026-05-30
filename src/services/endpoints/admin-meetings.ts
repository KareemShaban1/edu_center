import { apiClient, USE_MOCK } from '../api-client';
import type { MeetingSeriesProvider } from './teacher-meeting-series';

export interface AdminMeetingSeriesOption {
  id: number;
  topic: string;
  section_id: number;
}

export interface AdminMeetingRow {
  id: number;
  grade_id: number;
  class_id: number;
  section_id: number;
  section_label: string;
  topic: string;
  start_at: string;
  duration: number;
  provider: MeetingSeriesProvider;
  room_slug?: string | null;
  join_url?: string | null;
  moderator_url?: string | null;
  password?: string | null;
  record_enabled?: boolean;
  external_ref?: string | null;
  created_by: string;
  series_id?: number | null;
  location?: string;
  notes?: string;
}

export interface AdminMeetingSavePayload {
  section_id: number;
  topic: string;
  start_at: string;
  duration: number;
  provider: MeetingSeriesProvider;
  series_id?: number | null;
  join_url?: string;
  moderator_url?: string;
  password?: string;
  external_ref?: string;
  location?: string;
  notes?: string;
  record_enabled?: boolean;
}

export const adminMeetingsApi = {
  async list(): Promise<{ meetings: AdminMeetingRow[]; series_options: AdminMeetingSeriesOption[] }> {
    if (USE_MOCK) return { meetings: [], series_options: [] };
    return apiClient.get('/admin/meetings', undefined, false);
  },

  async create(payload: AdminMeetingSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post('/admin/meetings', payload, false);
  },

  async update(id: number, payload: AdminMeetingSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.put(`/admin/meetings/${id}`, payload, false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/meetings/${id}`, false);
  },
};
