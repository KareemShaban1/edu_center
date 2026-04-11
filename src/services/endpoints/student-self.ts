import { apiClient, USE_MOCK } from '../api-client';



export interface StudentSelfBootstrapPayload {

  meetings: Array<{

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

  attendance: Array<{

    id: number;

    date: string;

    status: 'present' | 'absent' | 'late';

    notes?: string;

  }>;

  grades: Array<{

    id: number;

    source: 'exam' | 'quiz';

    subject: string;

    date: string;

    score: number | null;

    total: number;

    attendance_status?: 'present' | 'absent' | 'late';

    notes?: string;

  }>;

  homework: Array<{

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

  }>;

  homework_options: Array<{ id: number; title: string }>;

  library: Array<{

    id: number;

    title: string;

    type: string;

    notes?: string;

    url?: string | null;

  }>;

}



export interface StudentMeetingPayload {

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

  status: 'not_submitted' | 'submitted' | 'late' | 'approved' | 'rejected';

  student_notes?: string;

  response?: string;

  degree?: string;

  rate?: string;

}



export interface StudentLibraryPayload {

  title: string;

  type: 'textbook' | 'manual' | 'workbook' | 'reference' | 'resource';

  notes?: string;

}



export const studentSelfApi = {

  async bootstrap(): Promise<StudentSelfBootstrapPayload> {

    if (USE_MOCK) {

      return { meetings: [], attendance: [], grades: [], homework: [], homework_options: [], library: [] };

    }

    return apiClient.get<StudentSelfBootstrapPayload>('/student/bootstrap', undefined, false);

  },

  async createMeeting(payload: StudentMeetingPayload): Promise<void> {

    await apiClient.post('/student/meetings', payload, false);

  },

  async updateMeeting(id: number, payload: StudentMeetingPayload): Promise<void> {

    await apiClient.put(`/student/meetings/${id}`, payload, false);

  },

  async deleteMeeting(id: number): Promise<void> {

    await apiClient.delete(`/student/meetings/${id}`, false);

  },

  async getLiveKitToken(meetingId: number): Promise<{ token: string; url: string; room: string }> {

    return apiClient.get(`/student/meetings/${meetingId}/livekit-token`, undefined, false);

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

    await apiClient.post('/student/homework/submissions', payload, false);

  },

  async updateHomeworkSubmission(id: number, payload: StudentHomeworkPayload): Promise<void> {

    await apiClient.put(`/student/homework/submissions/${id}`, payload, false);

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


