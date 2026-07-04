import { apiClient, USE_MOCK } from '../api-client';

export interface AdminHomeworkSummary {
  id: number;
  title: string;
  content: string;
  grade_id: number;
  classroom_id: number;
  section_id: number;
  grade_name: string;
  class_name: string;
  section_name: string;
  start_date: string;
  due_date: string;
}

export interface AdminHomeworkSubmissionRow {
  student_id: number;
  student_name: string;
  submission_id: number | null;
  status: 'not_submitted' | 'submitted' | 'late' | 'approved' | 'rejected';
  degree: string;
  rate: string;
  student_notes: string;
  response: string;
  upload_date: string;
  file_url: string | null;
  file_name: string | null;
  correction_url: string | null;
  correction_name: string | null;
}

export interface AdminHomeworkReviewPayload {
  status: 'submitted' | 'late' | 'approved' | 'rejected';
  degree?: string;
  rate?: string;
  response?: string;
}

export const adminHomeworkApi = {
  async getSubmissions(homeworkId: number): Promise<{
    homework: AdminHomeworkSummary;
    submissions: AdminHomeworkSubmissionRow[];
  }> {
    if (USE_MOCK) {
      return {
        homework: {
          id: homeworkId,
          title: 'Sample homework',
          content: '',
          grade_id: 1,
          classroom_id: 1,
          section_id: 1,
          grade_name: 'Grade',
          class_name: 'Class',
          section_name: 'Section',
          start_date: '',
          due_date: '',
        },
        submissions: [],
      };
    }
    return apiClient.get(`/admin/homework/${homeworkId}/submissions`, undefined, false);
  },

  async reviewSubmission(submissionId: number, payload: AdminHomeworkReviewPayload): Promise<AdminHomeworkSubmissionRow> {
    if (USE_MOCK) {
      return {
        student_id: 1,
        student_name: 'Student',
        submission_id: submissionId,
        status: payload.status,
        degree: payload.degree ?? '',
        rate: payload.rate ?? '',
        student_notes: '',
        response: payload.response ?? '',
        upload_date: '',
        file_url: null,
        file_name: null,
      };
    }
    const res = await apiClient.put<{ submission: AdminHomeworkSubmissionRow }>(
      `/admin/homework/submissions/${submissionId}`,
      payload,
      false,
    );
    return res.submission;
  },

  async getSubmission(submissionId: number): Promise<{
    homework: AdminHomeworkSummary;
    submission: AdminHomeworkSubmissionRow;
  }> {
    if (USE_MOCK) {
      return {
        homework: {
          id: 1,
          title: 'Sample homework',
          content: '',
          grade_id: 1,
          classroom_id: 1,
          section_id: 1,
          grade_name: 'Grade',
          class_name: 'Class',
          section_name: 'Section',
          start_date: '',
          due_date: '',
        },
        submission: {
          student_id: 1,
          student_name: 'Student',
          submission_id: submissionId,
          status: 'submitted',
          degree: '',
          rate: '',
          student_notes: '',
          response: '',
          upload_date: '',
          file_url: null,
          file_name: null,
          correction_url: null,
          correction_name: null,
        },
      };
    }
    return apiClient.get(`/admin/homework/submissions/${submissionId}`, undefined, false);
  },

  async uploadCorrection(submissionId: number, file: File): Promise<AdminHomeworkSubmissionRow> {
    if (USE_MOCK) {
      return {
        student_id: 1,
        student_name: 'Student',
        submission_id: submissionId,
        status: 'submitted',
        degree: '',
        rate: '',
        student_notes: '',
        response: '',
        upload_date: '',
        file_url: null,
        file_name: null,
        correction_url: URL.createObjectURL(file),
        correction_name: file.name,
      };
    }
    const fd = new FormData();
    fd.append('correction', file);
    const res = await apiClient.upload<{ submission: AdminHomeworkSubmissionRow }>(
      `/admin/homework/submissions/${submissionId}/correction`,
      fd,
      false,
    );
    return res.submission;
  },
};
