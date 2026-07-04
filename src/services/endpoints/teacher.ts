import { apiClient, USE_MOCK } from '../api-client';

export interface TeacherBootstrapPayload {
  classes: Array<{
    id: number;
    name: string;
    grade_id: number;
    class_id: number;
    grade: string;
    class: string;
    section: string;
    students: number;
    students_list?: Array<{ id: number; name: string }>;
    schedule?: string;
  }>;
  attendance: Array<{
    id: number;
    student_id: number;
    grade_id: number;
    class_id: number;
    section_id: number;
    grade: string;
    class: string;
    section: string;
    date: string;
    status: 'present' | 'absent' | 'late';
    student?: { name: string };
  }>;
  exams: Array<{
    id: number;
    name: string;
    subject: string;
    grade_id: number;
    class_id: number;
    section_id: number;
    grade: string;
    class: string;
    section: string;
    date: string;
    student_name?: string;
    degree?: number | null;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
    status: string;
  }>;
  quizzes: Array<{
    id: number;
    name: string;
    subject: string;
    grade_id: number;
    class_id: number;
    section_id: number;
    grade: string;
    class: string;
    section: string;
    date: string;
    student_name?: string;
    degree?: number | null;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
    status: string;
  }>;
  homework: Array<{
    id: number;
    title: string;
    subject: string;
    grade_id: number;
    class_id: number;
    section_id: number;
    grade: string;
    class: string;
    section: string;
    due_date: string;
    submissions: number;
  }>;
  library: Array<{
    id: number;
    title: string;
    type: string;
    grade_id: number;
    class_id: number;
    section_id: number;
    grade: string;
    class: string;
    section: string;
    date: string;
    url?: string | null;
  }>;
}

export const teacherApi = {
  async bootstrap(): Promise<TeacherBootstrapPayload> {
    if (USE_MOCK) {
      return { classes: [], attendance: [], exams: [], quizzes: [], homework: [], library: [] };
    }
    return apiClient.get<TeacherBootstrapPayload>('/teacher/bootstrap', undefined, false);
  },
};

