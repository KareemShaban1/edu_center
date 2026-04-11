import { apiClient, USE_MOCK } from '../api-client';
import {
  mockAnnouncements,
  mockAttendance,
  mockClasses,
  mockFees,
  mockGrades,
  mockHomework,
  mockLessons,
  mockParents,
  mockSections,
  mockStudents,
  mockTeachers,
  mockUnits,
} from '../mock-data';

export interface AdminBootstrapPayload {
  tenant?: {
    id: string | number;
    slug?: string;
    database?: string;
  };
  grades: unknown[];
  classes: unknown[];
  sections: unknown[];
  students: unknown[];
  teachers: unknown[];
  parents: unknown[];
  attendance: unknown[];
  fees: unknown[];
  units: unknown[];
  lessons: unknown[];
  homework: unknown[];
  library: unknown[];
  announcements: unknown[];
  users: unknown[];
  roles: unknown[];
  reports?: Record<string, number>;
}

export const adminApi = {
  async bootstrap(): Promise<AdminBootstrapPayload> {
    if (USE_MOCK) {
      return {
        grades: mockGrades,
        classes: mockClasses,
        sections: mockSections,
        students: mockStudents,
        teachers: mockTeachers,
        parents: mockParents,
        attendance: mockAttendance,
        fees: mockFees,
        units: mockUnits,
        lessons: mockLessons,
        homework: mockHomework,
        library: [],
        announcements: mockAnnouncements,
        users: [],
        roles: [],
        reports: {
          students: mockStudents.length,
          teachers: mockTeachers.length,
          parents: mockParents.length,
          attendance: mockAttendance.length,
        },
      };
    }

    return apiClient.get<AdminBootstrapPayload>('/admin/bootstrap', undefined, false);
  },
};
