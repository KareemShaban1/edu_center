import { apiClient, USE_MOCK } from '../api-client';
import type { Teacher } from '@/types/models';
import { mockTeachers } from '../mock-data';

export interface TeacherSavePayload {
  name: string;
  email: string;
  password?: string;
  specialization: string;
  phone: string;
  gender: string;
  status?: 'active' | 'inactive';
  class_ids: number[];
  files?: File[];
  remove_media_ids?: number[];
}

interface TeacherEnvelope {
  teacher: Teacher;
}

function appendUploadFiles(fd: FormData, files?: File[]) {
  (files || [])
    .filter((file): file is File => file instanceof File && file.size > 0)
    .forEach((file, index) => fd.append(`files[${index}]`, file, file.name));
}

function toFormData(payload: TeacherSavePayload): FormData {
  const fd = new FormData();
  fd.append('name', payload.name);
  fd.append('email', payload.email);
  if (payload.password) fd.append('password', payload.password);
  fd.append('specialization', payload.specialization);
  fd.append('phone', payload.phone);
  fd.append('gender', payload.gender);
  if (payload.status) fd.append('status', payload.status);
  payload.class_ids.forEach(id => fd.append('class_ids[]', String(id)));
  appendUploadFiles(fd, payload.files);
  (payload.remove_media_ids || []).forEach(id => fd.append('remove_media_ids[]', String(id)));
  return fd;
}

export const adminTeachersApi = {
  async create(payload: TeacherSavePayload): Promise<Teacher> {
    if (USE_MOCK) {
      return {
        ...mockTeachers[0],
        ...payload,
        id: Date.now(),
        media: [],
      };
    }
    const res = await apiClient.upload<TeacherEnvelope>('/admin/teachers', toFormData(payload), false);
    return res.teacher;
  },

  async update(id: number, payload: TeacherSavePayload): Promise<Teacher> {
    if (USE_MOCK) {
      return {
        ...mockTeachers[0],
        ...payload,
        id,
      };
    }
    const res = await apiClient.upload<TeacherEnvelope>(`/admin/teachers/${id}`, toFormData(payload), false);
    return res.teacher;
  },
};
