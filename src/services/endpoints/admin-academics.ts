import { apiClient, USE_MOCK } from '../api-client';
import type { ClassRoom, Grade, Section } from '@/types/models';
import { mockClasses, mockGrades, mockSections } from '../mock-data';

interface GradeEnvelope { grade: Grade }
interface ClassEnvelope { class: ClassRoom }
interface SectionEnvelope { section: Section }

export const adminAcademicsApi = {
  async createGrade(payload: Pick<Grade, 'name' | 'notes'>): Promise<Grade> {
    if (USE_MOCK) return { id: Date.now(), ...payload };
    const res = await apiClient.post<GradeEnvelope>('/admin/grades', payload, false);
    return res.grade;
  },
  async updateGrade(id: number, payload: Pick<Grade, 'name' | 'notes'>): Promise<Grade> {
    if (USE_MOCK) return { ...(mockGrades[0] || { id, name: '', notes: '' }), ...payload, id };
    const res = await apiClient.put<GradeEnvelope>(`/admin/grades/${id}`, payload, false);
    return res.grade;
  },

  async createClass(payload: Pick<ClassRoom, 'name' | 'grade_id' | 'notes'>): Promise<ClassRoom> {
    if (USE_MOCK) return { id: Date.now(), ...payload };
    const res = await apiClient.post<ClassEnvelope>('/admin/classes', payload, false);
    return res.class;
  },
  async updateClass(id: number, payload: Pick<ClassRoom, 'name' | 'grade_id' | 'notes'>): Promise<ClassRoom> {
    if (USE_MOCK) return { ...(mockClasses[0] || { id, name: '', grade_id: 0, notes: '' }), ...payload, id };
    const res = await apiClient.put<ClassEnvelope>(`/admin/classes/${id}`, payload, false);
    return res.class;
  },

  async createSection(payload: Pick<Section, 'name' | 'grade_id' | 'class_id' | 'teacher_id'>): Promise<Section> {
    if (USE_MOCK) return { id: Date.now(), ...payload };
    const res = await apiClient.post<SectionEnvelope>('/admin/sections', payload, false);
    return res.section;
  },
  async updateSection(id: number, payload: Pick<Section, 'name' | 'grade_id' | 'class_id' | 'teacher_id'>): Promise<Section> {
    if (USE_MOCK) return { ...(mockSections[0] || { id, name: '', grade_id: 0, class_id: 0 }), ...payload, id };
    const res = await apiClient.put<SectionEnvelope>(`/admin/sections/${id}`, payload, false);
    return res.section;
  },
};

