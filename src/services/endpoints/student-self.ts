import { apiClient, USE_MOCK } from '../api-client';
import type { CenterScopedRow } from '@/types/models';

export interface StudentSelfBootstrapPayload {
  sessions: Array<CenterScopedRow & {
    id: number;

    topic: string;

    teacher: string;

    start_at: string;

    duration: number;

    provider: 'jitsi' | 'livekit' | 'external' | 'offline';

    room_slug?: string;

    join_url?: string;

    moderator_url?: string;

    password?: string;

    record_enabled?: boolean;

    external_ref?: string;

    location?: string;
    notes?: string;

    livekit_url?: string;

  }>;

  attendance: Array<CenterScopedRow & {
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late';
    notes?: string;
  }>;

  grades: Array<CenterScopedRow & {
    id: number;
    source: 'exam' | 'quiz';
    subject: string;
    date: string;
    score: number | null;
    total: number;
    attendance_status?: 'present' | 'absent' | 'late';
    notes?: string;
  }>;

  homework: Array<CenterScopedRow & {
    id: number | string;
    submission_id?: number | null;
    homework_id: number;
    title: string;
    subject: string;
    due_date: string;
    status: string;
    grade: string;
    student_notes?: string;
    response?: string;
    file_url?: string | null;
    file_name?: string | null;
    correction_url?: string | null;
    correction_name?: string | null;
    upload_date?: string;
    center_id?: string | number;
    center_slug?: string;
  }>;

  homework_options: Array<{ id: number; title: string; center_id?: string | number }>;

  library: Array<CenterScopedRow & {
    id: number;
    title: string;
    type: string;
    notes?: string;
    url?: string | null;
  }>;

  certifications?: Array<CenterScopedRow & {
    id: number;
    template_id?: number | null;
    title: string;
    content: string;
    design?: import('@/lib/certification/types').CertificateDesignConfig | null;
    context: string;
    context_date?: string | null;
    issued_at?: string | null;
    is_custom?: boolean;
  }>;

  centers?: StudentCenterSummary[];
}

export interface StudentCenterProfile {
  id: number;
  name: string;
  email: string;
  grade_id?: number;
  class_id?: number;
  section_id?: number;
  grade_name?: string | null;
  class_name?: string | null;
  section_name?: string | null;
}

export interface StudentCenterStats {
  sessions_count: number;
  attendance_rate: number | null;
  gpa: number | null;
  pending_homework: number;
  library_items: number;
}

export interface StudentCenterSummary {
  membership_id?: number | null;
  center_id: string | number;
  center_slug?: string;
  center_name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  profile?: StudentCenterProfile | null;
  stats?: StudentCenterStats;
}



export interface StudentSessionPayload {

  topic: string;

  start_at: string;

  duration: number;

  provider: 'jitsi' | 'livekit' | 'external' | 'offline';

  join_url?: string;

  moderator_url?: string;

  password?: string;

  external_ref?: string;

  record_enabled?: boolean;

  location?: string;

  notes?: string;

}



export interface StudentAttendancePayload {

  date: string;

  status: 'present' | 'absent' | 'late';

  notes?: string;

}



export interface StudentGradePayload {

  source: 'exam' | 'quiz';

  date: string;

  degree: number | null;

  attendance_status: 'present' | 'absent' | 'late';

  notes?: string;

}



export interface StudentHomeworkPayload {
  homework_id: number;
  student_notes?: string;
  file?: File;
  center_id?: number | string;
  center_slug?: string;
}

function toHomeworkFormData(payload: StudentHomeworkPayload): FormData {
  const fd = new FormData();
  fd.append('homework_id', String(payload.homework_id));
  if (payload.student_notes) fd.append('student_notes', payload.student_notes);
  if (payload.center_id != null && payload.center_id !== '') {
    fd.append('center_id', String(payload.center_id));
  }
  if (payload.center_slug) fd.append('center_slug', payload.center_slug);
  if (payload.file instanceof File && payload.file.size > 0) {
    fd.append('files[0]', payload.file, payload.file.name);
  }
  return fd;
}



export interface StudentLibraryPayload {

  title: string;

  type: 'textbook' | 'manual' | 'workbook' | 'reference' | 'resource';

  notes?: string;

}



export const studentSelfApi = {

  async bootstrap(): Promise<StudentSelfBootstrapPayload> {

    if (USE_MOCK) {

      return { sessions: [], attendance: [], grades: [], homework: [], homework_options: [], library: [] };

    }

    return apiClient.get<StudentSelfBootstrapPayload>('/student/bootstrap', undefined, false);

  },

  async createSession(payload: StudentSessionPayload): Promise<void> {

    await apiClient.post('/student/sessions', payload, false);

  },

  async updateSession(id: number, payload: StudentSessionPayload): Promise<void> {

    await apiClient.put(`/student/sessions/${id}`, payload, false);

  },

  async deleteSession(id: number): Promise<void> {

    await apiClient.delete(`/student/sessions/${id}`, false);

  },

  async getLiveKitToken(sessionId: number): Promise<{ token: string; url: string; room: string }> {

    return apiClient.get(`/student/sessions/${sessionId}/livekit-token`, undefined, false);

  },

  async createAttendance(payload: StudentAttendancePayload): Promise<void> {

    await apiClient.post('/student/attendance', payload, false);

  },

  async updateAttendance(id: number, payload: StudentAttendancePayload): Promise<void> {

    await apiClient.put(`/student/attendance/${id}`, payload, false);

  },

  async deleteAttendance(id: number): Promise<void> {

    await apiClient.delete(`/student/attendance/${id}`, false);

  },

  async createGrade(payload: StudentGradePayload): Promise<void> {

    await apiClient.post('/student/grades', payload, false);

  },

  async updateGrade(source: 'exam' | 'quiz', id: number, payload: Omit<StudentGradePayload, 'source'>): Promise<void> {

    await apiClient.put(`/student/grades/${source}/${id}`, payload, false);

  },

  async deleteGrade(source: 'exam' | 'quiz', id: number): Promise<void> {

    await apiClient.delete(`/student/grades/${source}/${id}`, false);

  },

  async createHomeworkSubmission(payload: StudentHomeworkPayload): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.upload('/student/homework/submissions', toHomeworkFormData(payload), false);
  },

  async updateHomeworkSubmission(id: number, payload: StudentHomeworkPayload): Promise<void> {
    if (USE_MOCK) return;
    if (payload.file instanceof File && payload.file.size > 0) {
      await apiClient.upload(`/student/homework/submissions/${id}`, toHomeworkFormData(payload), false);
      return;
    }
    await apiClient.put(`/student/homework/submissions/${id}`, {
      homework_id: payload.homework_id,
      student_notes: payload.student_notes ?? '',
      center_id: payload.center_id,
      center_slug: payload.center_slug,
    }, false);
  },

  async deleteHomeworkSubmission(id: number): Promise<void> {

    await apiClient.delete(`/student/homework/submissions/${id}`, false);

  },

  async createLibrary(payload: StudentLibraryPayload): Promise<void> {

    await apiClient.post('/student/library', payload, false);

  },

  async updateLibrary(id: number, payload: StudentLibraryPayload): Promise<void> {

    await apiClient.put(`/student/library/${id}`, payload, false);

  },

  async deleteLibrary(id: number): Promise<void> {

    await apiClient.delete(`/student/library/${id}`, false);

  },

};


