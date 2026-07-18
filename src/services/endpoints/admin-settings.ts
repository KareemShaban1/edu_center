import { apiClient, USE_MOCK } from '../api-client';

export interface AdminSettings {
  center_name: string;
  center_email: string;
  phone: string;
  address: string;
  current_session: string;
  timezone: string;
  auto_generate_sessions: boolean;
  auto_session_days_ahead: number;
  auto_session_duration: number;
  auto_session_type: 'offline' | 'online';
  auto_session_provider: 'offline' | 'jitsi' | 'livekit';
  auto_session_location: string;
}

export type AdminSettingsPayload = Partial<AdminSettings> & {
  generate_now?: boolean;
};

export interface AdminSettingsSaveResult {
  message: string;
  settings: AdminSettings;
  generation?: {
    created: number;
    skipped: number;
    sections: number;
    enabled: boolean;
  } | null;
}

const mockSettings: AdminSettings = {
  center_name: 'EduCenter Academy',
  center_email: 'info@educenter.com',
  phone: '+966500000000',
  address: '123 Education St',
  current_session: '2025-2026',
  timezone: 'Asia/Riyadh',
  auto_generate_sessions: false,
  auto_session_days_ahead: 14,
  auto_session_duration: 60,
  auto_session_type: 'offline',
  auto_session_provider: 'offline',
  auto_session_location: '',
};

export const adminSettingsApi = {
  async get(): Promise<AdminSettings> {
    if (USE_MOCK) return { ...mockSettings };
    const res = await apiClient.get<{ settings: AdminSettings }>('/admin/settings', undefined, false);
    return res.settings;
  },

  async update(payload: AdminSettingsPayload): Promise<AdminSettingsSaveResult> {
    if (USE_MOCK) {
      Object.assign(mockSettings, payload);
      return { message: 'Settings saved.', settings: { ...mockSettings }, generation: null };
    }
    return apiClient.put<AdminSettingsSaveResult>('/admin/settings', payload, false);
  },
};
