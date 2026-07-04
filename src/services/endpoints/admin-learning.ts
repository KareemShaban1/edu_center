import { apiClient, USE_MOCK } from '../api-client';
import type { Homework, Lesson, MediaFile, Unit } from '@/types/models';

interface UnitEnvelope { unit: Unit }
interface LessonEnvelope { lesson: Lesson }
interface HomeworkEnvelope { homework: Homework }

export interface UnitSavePayload {
  name: string;
  class_id: number;
  notes?: string;
  files?: File[];
  remove_media_ids?: number[];
}

function toUnitFormData(payload: UnitSavePayload): FormData {
  const fd = new FormData();
  fd.append('name', payload.name);
  fd.append('class_id', String(payload.class_id));
  fd.append('notes', payload.notes ?? '');
  appendUploadFiles(fd, payload.files);
  (payload.remove_media_ids || []).forEach(id => fd.append('remove_media_ids[]', String(id)));
  return fd;
}

export interface LessonSavePayload {
  name: string;
  unit_id: number;
  notes?: string;
  files?: File[];
  remove_media_ids?: number[];
}

function toLessonFormData(payload: LessonSavePayload): FormData {
  const fd = new FormData();
  fd.append('name', payload.name);
  fd.append('unit_id', String(payload.unit_id));
  fd.append('notes', payload.notes ?? '');
  appendUploadFiles(fd, payload.files);
  (payload.remove_media_ids || []).forEach(id => fd.append('remove_media_ids[]', String(id)));
  return fd;
}

function appendUploadFiles(fd: FormData, files?: File[]) {
  (files || [])
    .filter((file): file is File => file instanceof File && file.size > 0)
    .forEach((file, index) => fd.append(`files[${index}]`, file, file.name));
}

export const adminLearningApi = {
  async createUnit(payload: UnitSavePayload): Promise<Unit> {
    if (USE_MOCK) return { id: Date.now(), name: payload.name, class_id: payload.class_id, notes: payload.notes, media: [] };
    const res = await apiClient.upload<UnitEnvelope>('/admin/units', toUnitFormData(payload), false);
    return res.unit;
  },
  async updateUnit(id: number, payload: UnitSavePayload): Promise<Unit> {
    if (USE_MOCK) return { id, name: payload.name, class_id: payload.class_id, notes: payload.notes, media: [] };
    const res = await apiClient.upload<UnitEnvelope>(`/admin/units/${id}`, toUnitFormData(payload), false);
    return res.unit;
  },

  async createLesson(payload: LessonSavePayload): Promise<Lesson> {
    if (USE_MOCK) return { id: Date.now(), name: payload.name, unit_id: payload.unit_id, notes: payload.notes, media: [] };
    const res = await apiClient.upload<LessonEnvelope>('/admin/lessons', toLessonFormData(payload), false);
    return res.lesson;
  },
  async updateLesson(id: number, payload: LessonSavePayload): Promise<Lesson> {
    if (USE_MOCK) return { id, name: payload.name, unit_id: payload.unit_id, notes: payload.notes, media: [] };
    const res = await apiClient.upload<LessonEnvelope>(`/admin/lessons/${id}`, toLessonFormData(payload), false);
    return res.lesson;
  },

  async createHomework(payload: Pick<Homework, 'title' | 'content' | 'grade_id' | 'classroom_id' | 'section_id' | 'start_date' | 'due_date'>): Promise<Homework> {
    if (USE_MOCK) return { id: Date.now(), ...payload } as Homework;
    const res = await apiClient.post<HomeworkEnvelope>('/admin/homework', payload, false);
    return res.homework;
  },
  async updateHomework(id: number, payload: Pick<Homework, 'title' | 'content' | 'grade_id' | 'classroom_id' | 'section_id' | 'start_date' | 'due_date'>): Promise<Homework> {
    if (USE_MOCK) return { id, ...payload } as Homework;
    const res = await apiClient.put<HomeworkEnvelope>(`/admin/homework/${id}`, payload, false);
    return res.homework;
  },
};

export type { MediaFile };
