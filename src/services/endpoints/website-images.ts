import { apiClient, USE_MOCK } from '../api-client';

export interface WebsiteImageOverride {
  key: string;
  url: string;
  name: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  updated_at: string;
}

interface WebsiteImageListResponse {
  images: Record<string, WebsiteImageOverride>;
}

export const websiteImagesApi = {
  async list(): Promise<Record<string, WebsiteImageOverride>> {
    if (USE_MOCK) return {};
    const response = await apiClient.get<WebsiteImageListResponse>('/website-images', undefined, false);
    return response.images;
  },

  async replace(key: string, file: File): Promise<WebsiteImageOverride> {
    if (USE_MOCK) {
      return {
        key,
        url: URL.createObjectURL(file),
        name: file.name,
        mime: file.type,
        bytes: file.size,
        width: null,
        height: null,
        updated_at: new Date().toISOString(),
      };
    }

    const form = new FormData();
    form.append('image', file);
    return apiClient.upload<WebsiteImageOverride>(
      `/developer/website-images/${encodeURIComponent(key)}`,
      form,
      false,
    );
  },

  async reset(key: string): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/developer/website-images/${encodeURIComponent(key)}`, false);
  },
};
