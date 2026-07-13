import { apiClient, USE_MOCK } from '../api-client';

export interface UiTranslationOverride {
  key: string;
  en: string | null;
  ar: string | null;
  is_deleted: boolean;
  updated_at: string | null;
}

export interface UiTranslationInput {
  key: string;
  en: string;
  ar: string;
}

interface UiTranslationListResponse {
  translations: UiTranslationOverride[];
}

export const uiTranslationsApi = {
  async list(): Promise<UiTranslationOverride[]> {
    if (USE_MOCK) return [];
    const response = await apiClient.get<UiTranslationListResponse>('/ui-translations', undefined, false);
    return response.translations;
  },

  async create(payload: UiTranslationInput): Promise<UiTranslationOverride> {
    if (USE_MOCK) {
      return { ...payload, is_deleted: false, updated_at: new Date().toISOString() };
    }
    return apiClient.post<UiTranslationOverride>('/developer/ui-translations', payload, false);
  },

  async update(currentKey: string, payload: UiTranslationInput): Promise<UiTranslationOverride> {
    if (USE_MOCK) {
      return { ...payload, is_deleted: false, updated_at: new Date().toISOString() };
    }
    return apiClient.put<UiTranslationOverride>(
      `/developer/ui-translations/${encodeURIComponent(currentKey)}`,
      payload,
      false,
    );
  },

  async delete(key: string): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/developer/ui-translations/${encodeURIComponent(key)}`, false);
  },
};
