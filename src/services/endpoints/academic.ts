import { apiClient, USE_MOCK } from '../api-client';
import { mockGrades, mockClasses, mockSections, mockAttendance, mockFees, mockPayments } from '../mock-data';
import type { Grade, ClassRoom, Section, Attendance, Fee, Payment, PaginatedResponse } from '@/types/models';

export const academicApi = {
  async getGrades(): Promise<Grade[]> {
    if (USE_MOCK) return mockGrades;
    return apiClient.get('/grades');
  },
  async getClasses(gradeId: number): Promise<ClassRoom[]> {
    if (USE_MOCK) return mockClasses.filter(c => c.grade_id === gradeId);
    return apiClient.get(`/Get_Classes/${gradeId}`);
  },
  async getSections(classId: number, gradeId: number): Promise<Section[]> {
    if (USE_MOCK) return mockSections.filter(s => s.class_id === classId);
    return apiClient.get(`/Get_Sections/${classId}/${gradeId}`);
  },
  async getAttendance(params?: Record<string, string | number>): Promise<PaginatedResponse<Attendance>> {
    if (USE_MOCK) return { data: mockAttendance, recordsTotal: mockAttendance.length, recordsFiltered: mockAttendance.length };
    return apiClient.getPaginated<Attendance>('/attendance/data', params);
  },
  async getFees(): Promise<Fee[]> {
    if (USE_MOCK) return mockFees;
    return apiClient.get('/fees');
  },
  async getFeeAmount(id: number): Promise<{ amount: number }> {
    if (USE_MOCK) return { amount: mockFees[0]?.amount || 0 };
    return apiClient.get(`/Get_amount/${id}`);
  },
  async getPayments(params?: Record<string, string | number>): Promise<PaginatedResponse<Payment>> {
    if (USE_MOCK) return { data: mockPayments, recordsTotal: mockPayments.length, recordsFiltered: mockPayments.length };
    return apiClient.getPaginated<Payment>('/payments/data', params);
  },
};
