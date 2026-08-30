import { apiClient, USE_MOCK } from '../api-client';
import type { PlatformArea, PlatformCity, PlatformGovernorate } from '@/types/models';

export interface AdminSettings {
  center_name: string;
  center_email: string;
  phone: string;
  address: string;
  governorate_id?: number | null;
  city_id?: number | null;
  area_id?: number | null;
  governorate_name?: string | null;
  city_name?: string | null;
  area_name?: string | null;
  lat?: number | null;
  long?: number | null;
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

  async listGovernorates(): Promise<PlatformGovernorate[]> {
    if (USE_MOCK) {
      return [
        { id: 1, name: 'Qalyubia', status: 'active' },
        { id: 2, name: 'Cairo', status: 'active' },
      ];
    }
    return apiClient.get<PlatformGovernorate[]>('/admin/governorates', undefined, false);
  },

  async listCities(params?: { governorate_id?: number }): Promise<PlatformCity[]> {
    if (USE_MOCK) {
      const all = [
        { id: 1, name: 'Benha', governorate_id: 1, status: 'active' as const },
        { id: 2, name: 'Cairo', governorate_id: 2, status: 'active' as const },
      ];
      return params?.governorate_id ? all.filter(c => c.governorate_id === params.governorate_id) : all;
    }
    const query = params?.governorate_id ? { governorate_id: params.governorate_id } : undefined;
    return apiClient.get<PlatformCity[]>('/admin/cities', query, false);
  },

  async listAreas(params?: { city_id?: number }): Promise<PlatformArea[]> {
    if (USE_MOCK) {
      const all: PlatformArea[] = [
        { id: 1, name: 'Benha Center', city_id: 1, lat: 30.4663, long: 31.1848, status: 'active' },
        { id: 2, name: 'Nasr City', city_id: 2, lat: 30.0511, long: 31.3656, status: 'active' },
      ];
      return params?.city_id ? all.filter(a => a.city_id === params.city_id) : all;
    }
    const query = params?.city_id ? { city_id: params.city_id } : undefined;
    return apiClient.get<PlatformArea[]>('/admin/areas', query, false);
  },
};
