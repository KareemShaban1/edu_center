import { apiClient, USE_MOCK } from '../api-client';

export interface AnnouncementMediaItem {
  id: number;
  name: string;
  file_name: string;
  mime_type?: string | null;
  size: number;
  url: string;
}

export interface AnnouncementItemPayload {
  id: number;
  title: string;
  content: string;
  grade_id: number;
  class_id: number;
  section_id: number;
  type: 'quiz' | 'exam' | 'others';
  time?: string | null;
  grade_name?: string;
  class_name?: string;
  section_name?: string;
  created_at: string;
  media: AnnouncementMediaItem[];
}

export interface AnnouncementSavePayload {
  title: string;
  content: string;
  grade_id: number;
  class_id: number;
  section_id: number;
  type: 'quiz' | 'exam' | 'others';
  time?: string | null;
  files?: File[];
  remove_media_ids?: number[];
}

function toFormData(payload: AnnouncementSavePayload): FormData {
  const fd = new FormData();
  fd.append('title', payload.title);
  fd.append('content', payload.content);
  fd.append('grade_id', String(payload.grade_id));
  fd.append('class_id', String(payload.class_id));
  fd.append('section_id', String(payload.section_id));
  fd.append('type', payload.type);
  if (payload.time) fd.append('time', payload.time);
  (payload.files || []).forEach(file => fd.append('files[]', file));
  (payload.remove_media_ids || []).forEach(id => fd.append('remove_media_ids[]', String(id)));
  return fd;
}

export const adminAnnouncementsApi = {
  async list(): Promise<AnnouncementItemPayload[]> {
    if (USE_MOCK) return [];
    const res = await apiClient.get<{ announcements: AnnouncementItemPayload[] }>('/admin/announcements', undefined, false);
    return res.announcements || [];
  },

  async create(payload: AnnouncementSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.upload('/admin/announcements', toFormData(payload), false);
  },

  async update(id: number, payload: AnnouncementSavePayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.upload(`/admin/announcements/${id}`, toFormData(payload), false);
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/announcements/${id}`, false);
  },
};

