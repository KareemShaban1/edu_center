import { apiClient, USE_MOCK } from '../api-client';

export interface AnnouncementMediaItem {
  id: number;
  name: string;
  file_name: string;
  mime_type?: string | null;
  type?: string;
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

interface AnnouncementEnvelope {
  announcement: AnnouncementItemPayload;
}

function appendUploadFiles(fd: FormData, files?: File[]) {
  (files || [])
    .filter((file): file is File => file instanceof File && file.size > 0)
    .forEach((file, index) => fd.append(`files[${index}]`, file, file.name));
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
  appendUploadFiles(fd, payload.files);
  (payload.remove_media_ids || []).forEach(id => fd.append('remove_media_ids[]', String(id)));
  return fd;
}

export const adminAnnouncementsApi = {
  async list(): Promise<AnnouncementItemPayload[]> {
    if (USE_MOCK) return [];
    const res = await apiClient.get<{ announcements: AnnouncementItemPayload[] }>('/admin/announcements', undefined, false);
    return res.announcements || [];
  },

  async create(payload: AnnouncementSavePayload): Promise<AnnouncementItemPayload> {
    if (USE_MOCK) {
      return {
        id: Date.now(),
        title: payload.title,
        content: payload.content,
        grade_id: payload.grade_id,
        class_id: payload.class_id,
        section_id: payload.section_id,
        type: payload.type,
        time: payload.time,
        created_at: new Date().toISOString().slice(0, 10),
        media: [],
      };
    }
    const res = await apiClient.upload<AnnouncementEnvelope>('/admin/announcements', toFormData(payload), false);
    return res.announcement;
  },

  async update(id: number, payload: AnnouncementSavePayload): Promise<AnnouncementItemPayload> {
    if (USE_MOCK) {
      return {
        id,
        title: payload.title,
        content: payload.content,
        grade_id: payload.grade_id,
        class_id: payload.class_id,
        section_id: payload.section_id,
        type: payload.type,
        time: payload.time,
        created_at: new Date().toISOString().slice(0, 10),
        media: [],
      };
    }
    const res = await apiClient.upload<AnnouncementEnvelope>(`/admin/announcements/${id}`, toFormData(payload), false);
    return res.announcement;
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/announcements/${id}`, false);
  },
};
