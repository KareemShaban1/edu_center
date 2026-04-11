import { apiClient, USE_MOCK } from '../api-client';
import type { Homework, Lesson, Unit } from '@/types/models';

interface UnitEnvelope { unit: Unit }
interface LessonEnvelope { lesson: Lesson }
interface HomeworkEnvelope { homework: Homework }

export const adminLearningApi = {
  async createUnit(payload: Pick<Unit, 'name' | 'class_id' | 'notes'>): Promise<Unit> {
    if (USE_MOCK) return { id: Date.now(), ...payload };
    const res = await apiClient.post<UnitEnvelope>('/admin/units', payload, false);
    return res.unit;
  },
  async updateUnit(id: number, payload: Pick<Unit, 'name' | 'class_id' | 'notes'>): Promise<Unit> {
    if (USE_MOCK) return { id, ...payload };
    const res = await apiClient.put<UnitEnvelope>(`/admin/units/${id}`, payload, false);
    return res.unit;
  },

  async createLesson(payload: Pick<Lesson, 'name' | 'unit_id' | 'notes'>): Promise<Lesson> {
    if (USE_MOCK) return { id: Date.now(), ...payload };
    const res = await apiClient.post<LessonEnvelope>('/admin/lessons', payload, false);
    return res.lesson;
  },
  async updateLesson(id: number, payload: Pick<Lesson, 'name' | 'unit_id' | 'notes'>): Promise<Lesson> {
    if (USE_MOCK) return { id, ...payload };
    const res = await apiClient.put<LessonEnvelope>(`/admin/lessons/${id}`, payload, false);
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

