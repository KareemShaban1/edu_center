import { apiClient, USE_MOCK } from '../api-client';
import { mockStudents } from '../mock-data';
import type { Student, PaginatedResponse } from '@/types/models';

export const studentsApi = {
  async list(params?: Record<string, string | number>): Promise<PaginatedResponse<Student>> {
    if (USE_MOCK) {
      return { data: mockStudents, recordsTotal: mockStudents.length, recordsFiltered: mockStudents.length };
    }
    return apiClient.getPaginated<Student>('/students/data', params);
  },
  async get(id: number): Promise<Student> {
    if (USE_MOCK) return mockStudents.find(s => s.id === id) || mockStudents[0];
    return apiClient.get(`/students/${id}`);
  },
  async create(data: Partial<Student>): Promise<Student> {
    if (USE_MOCK) return { ...mockStudents[0], ...data, id: Date.now() };
    return apiClient.post('/students', data);
  },
  async update(id: number, data: Partial<Student>): Promise<Student> {
    if (USE_MOCK) return { ...mockStudents[0], ...data, id };
    return apiClient.put(`/students/${id}`, data);
  },
  async delete(id: number): Promise<void> {
    if (USE_MOCK) return;
    return apiClient.delete(`/students/${id}`);
  },
};
