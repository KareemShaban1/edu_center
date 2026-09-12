import { apiClient, USE_MOCK } from '../api-client';

interface UiIconsResponse {
  icons: Record<string, string>;
}

export const uiIconsApi = {
  async list(): Promise<Record<string, string>> {
    if (USE_MOCK) return {};
    const response = await apiClient.get<UiIconsResponse>('/ui-icons', undefined, false);
    return response.icons || {};
  },

  async saveAll(icons: Record<string, string>): Promise<Record<string, string>> {
    if (USE_MOCK) return icons;
    const response = await apiClient.put<UiIconsResponse>('/platform/ui-icons', { icons }, false);
    return response.icons || {};
  },

  async updateOne(key: string, icon: string): Promise<Record<string, string>> {
    if (USE_MOCK) return { [key]: icon };
    const response = await apiClient.put<UiIconsResponse>(
      `/platform/ui-icons/${encodeURIComponent(key)}`,
      { icon },
      false,
    );
    return response.icons || {};
  },

  async reset(key: string): Promise<Record<string, string>> {
    if (USE_MOCK) return {};
    const response = await apiClient.delete<UiIconsResponse>(
      `/platform/ui-icons/${encodeURIComponent(key)}`,
      false,
    );
    return response.icons || {};
  },
};
