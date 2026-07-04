import { apiClient, USE_MOCK } from '../api-client';

export interface LibraryMediaItem {
  id: number;
  name: string;
  file_name: string;
  mime_type?: string | null;
  type?: string;
  size: number;
  url: string;
}

export interface LibraryItemPayload {
  id: number;
  title: string;
  grade_id: number;
  class_id: number;
  section_id: number;
  type: 'textbook' | 'manual' | 'workbook' | 'reference' | 'resource';
  notes?: string;
  grade_name?: string;
  class_name?: string;
  section_name?: string;
  created_at: string;
  media: LibraryMediaItem[];
}

export interface LibrarySavePayload {
  title: string;
  grade_id: number;
  class_id: number;
  section_id: number;
  type: 'textbook' | 'manual' | 'workbook' | 'reference' | 'resource';
  notes?: string;
  files?: File[];
  remove_media_ids?: number[];
}

interface LibraryEnvelope {
  library: LibraryItemPayload;
}

function appendUploadFiles(fd: FormData, files?: File[]) {
  (files || [])
    .filter((file): file is File => file instanceof File && file.size > 0)
    .forEach((file, index) => fd.append(`files[${index}]`, file, file.name));
}

function toFormData(payload: LibrarySavePayload): FormData {
  const fd = new FormData();
  fd.append('title', payload.title);
  fd.append('grade_id', String(payload.grade_id));
  fd.append('class_id', String(payload.class_id));
  fd.append('section_id', String(payload.section_id));
  fd.append('type', payload.type);
  if (payload.notes) fd.append('notes', payload.notes);
  appendUploadFiles(fd, payload.files);
  (payload.remove_media_ids || []).forEach(id => fd.append('remove_media_ids[]', String(id)));
  return fd;
}

export const adminLibraryApi = {
  async list(): Promise<LibraryItemPayload[]> {
    if (USE_MOCK) return [];
    const res = await apiClient.get<{ library: LibraryItemPayload[] }>('/admin/library', undefined, false);
    return res.library || [];
  },

  async create(payload: LibrarySavePayload): Promise<LibraryItemPayload> {
    if (USE_MOCK) {
      return {
        id: Date.now(),
        title: payload.title,
        grade_id: payload.grade_id,
        class_id: payload.class_id,
        section_id: payload.section_id,
        type: payload.type,
        notes: payload.notes,
        created_at: new Date().toISOString().slice(0, 10),
        media: [],
      };
    }
    const res = await apiClient.upload<LibraryEnvelope>('/admin/library', toFormData(payload), false);
    return res.library;
  },

  async update(id: number, payload: LibrarySavePayload): Promise<LibraryItemPayload> {
    if (USE_MOCK) {
      return {
        id,
        title: payload.title,
        grade_id: payload.grade_id,
        class_id: payload.class_id,
        section_id: payload.section_id,
        type: payload.type,
        notes: payload.notes,
        created_at: new Date().toISOString().slice(0, 10),
        media: [],
      };
    }
    const res = await apiClient.upload<LibraryEnvelope>(`/admin/library/${id}`, toFormData(payload), false);
    return res.library;
  },

  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/library/${id}`, false);
  },
};
