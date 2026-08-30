import { apiClient, USE_MOCK } from '../api-client';
import type { ExamBank, ExamLayout, Question } from '@/types/models';

interface QuestionEnvelope { question: Question }
interface ExamEnvelope { exam: ExamBank }

export type { ExamLayout };

export interface QuestionSavePayload {
  question_text: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  lesson_id: number;
  answers: Array<{
    id?: number;
    answer_text: string;
    is_correct: boolean;
  }>;
}

export interface ExamBankSavePayload {
  name: string;
  grade_id: number;
  class_id: number;
  notes?: string;
  question_ids?: number[];
}

export interface GenerateExamPayload {
  name: string;
  lesson_ids: number[];
  selection_mode?: 'random' | 'manual';
  question_count?: number;
  question_ids?: number[];
  notes?: string;
}

export interface BulkQuestionsPayload {
  lesson_id: number;
  questions: Array<{
    question_text: string;
    type: 'mcq' | 'true_false' | 'short_answer';
    lesson_id?: number;
    answers: Array<{
      answer_text: string;
      is_correct: boolean;
    }>;
  }>;
}

export const adminQuestionsApi = {
  async createQuestion(payload: QuestionSavePayload): Promise<Question> {
    if (USE_MOCK) {
      return {
        id: Date.now(),
        question_text: payload.question_text,
        type: payload.type,
        lesson_id: payload.lesson_id,
        exam_ids: [],
        answers: payload.answers.map((a, i) => ({ ...a, id: i + 1, question_id: Date.now() })),
      };
    }
    const res = await apiClient.post<QuestionEnvelope>('/admin/questions', payload, false);
    return res.question;
  },

  async updateQuestion(id: number, payload: QuestionSavePayload): Promise<Question> {
    if (USE_MOCK) {
      return { id, question_text: payload.question_text, type: payload.type, lesson_id: payload.lesson_id, exam_ids: [], answers: payload.answers };
    }
    const res = await apiClient.put<QuestionEnvelope>(`/admin/questions/${id}`, payload, false);
    return res.question;
  },

  async deleteQuestion(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/questions/${id}`, false);
  },

  async bulkCreateQuestions(payload: BulkQuestionsPayload): Promise<{ count: number }> {
    if (USE_MOCK) {
      return { count: payload.questions.length };
    }
    const res = await apiClient.post<{ count: number }>('/admin/questions/bulk', payload, false);
    return { count: res.count };
  },

  async createExam(payload: ExamBankSavePayload): Promise<ExamBank> {
    if (USE_MOCK) return { id: Date.now(), total_questions: 0, ...payload };
    const res = await apiClient.post<ExamEnvelope>('/admin/exam-bank', payload, false);
    return res.exam;
  },

  async updateExam(id: number, payload: ExamBankSavePayload): Promise<ExamBank> {
    if (USE_MOCK) return { id, total_questions: 0, ...payload };
    const res = await apiClient.put<ExamEnvelope>(`/admin/exam-bank/${id}`, payload, false);
    return res.exam;
  },

  async getExam(id: number): Promise<ExamBank> {
    if (USE_MOCK) return { id, name: 'Mock Exam', grade_id: 1, class_id: 1, total_questions: 0 };
    const res = await apiClient.get<ExamEnvelope>(`/admin/exam-bank/${id}`, false);
    return res.exam;
  },

  async deleteExam(id: number): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.delete(`/admin/exam-bank/${id}`, false);
  },

  async generateExam(payload: GenerateExamPayload): Promise<ExamBank> {
    if (USE_MOCK) {
      return {
        id: Date.now(),
        name: payload.name,
        grade_id: 1,
        class_id: 1,
        total_questions: payload.question_count ?? 5,
        lesson_ids: payload.lesson_ids,
        notes: payload.notes,
      };
    }
    const res = await apiClient.post<ExamEnvelope>('/admin/exam-bank/generate', payload, false);
    return res.exam;
  },

  async reorderExamQuestions(examId: number, questionIds: number[]): Promise<ExamBank> {
    if (USE_MOCK) {
      return { id: examId, name: 'Mock Exam', grade_id: 1, class_id: 1, total_questions: questionIds.length };
    }
    const res = await apiClient.put<ExamEnvelope>(`/admin/exam-bank/${examId}/questions/order`, { question_ids: questionIds }, false);
    return res.exam;
  },

  async updateExamLayout(examId: number, layout: ExamLayout): Promise<ExamBank> {
    if (USE_MOCK) {
      return { id: examId, name: 'Mock Exam', grade_id: 1, class_id: 1, total_questions: 0, layout };
    }
    const res = await apiClient.put<ExamEnvelope>(`/admin/exam-bank/${examId}/layout`, layout, false);
    return res.exam;
  },

  async exportExam(examId: number, format: 'pdf' | 'docx', filename: string): Promise<void> {
    if (USE_MOCK) return;
    await apiClient.download(`/admin/exam-bank/${examId}/export/${format}`, filename);
  },
};
