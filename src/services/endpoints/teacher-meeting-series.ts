import { apiClient, USE_MOCK } from '../api-client';

export type MeetingSeriesProvider =
  | 'jitsi'
  | 'livekit'
  | 'zoom'
  | 'microsoft_teams'
  | 'google_meet'
  | 'external'
  | 'offline';
export interface TeacherSectionOption {
  id: number;
  name: string;
}

export interface MeetingSeriesOccurrence {
  id: number;
  topic: string;
  start_at: string;
  duration: number;
  provider: MeetingSeriesProvider;
  room_slug: string;
  join_url: string;
  moderator_url?: string;
  location: string;
  notes: string;
  external_ref: string;
  is_over?: boolean;
}

export interface TeacherMeetingSeriesRow {
  id: number;
  topic: string;
  provider: MeetingSeriesProvider;
  week_days: number[];
  start_date: string;
  end_date: string | null;
  start_time: string;
  duration: number;
  record_enabled: boolean;
  location: string;
  notes: string;
  join_url: string;
  moderator_url: string;
  password?: string | null;
  external_ref: string | null;
  next_occurrences: MeetingSeriesOccurrence[];
  next_startable_occurrence?: MeetingSeriesOccurrence | null;
}

export interface TeacherMeetingSeriesPayload {
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

  // external
  join_url?: string;
  moderator_url?: string;
  password?: string;
  external_ref?: string;

  // offline
  location?: string;
  notes?: string;
}

export const teacherMeetingSeriesApi = {
  async list(): Promise<{ series: TeacherMeetingSeriesRow[]; sections: TeacherSectionOption[] }> {
    if (USE_MOCK) return { series: [], sections: [] };
    return apiClient.get('/teacher/meeting-series', undefined, false);
  },

  async create(payload: TeacherMeetingSeriesPayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.post('/teacher/meeting-series', payload, false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/teacher/meeting-series/${id}`, false);
  },

  async getLiveKitToken(meetingId: number): Promise<{ token: string; url: string; room: string }> {
    return apiClient.get(`/teacher/meetings/${meetingId}/livekit-token`, undefined, false);
  },
};

