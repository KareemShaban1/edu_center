import { apiClient, USE_MOCK } from '../api-client';

import type { CertificateDesignConfig } from '@/lib/certification/types';

export interface CertificationTemplate {
  id: number;
  title: string;
  content: string;
  variables: string[];
  design_id?: string | null;
  design?: CertificateDesignConfig | null;
  is_system?: boolean;
  background_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StudentCertification {
  id: number;
  template_id?: number | null;
  template_title?: string | null;
  student_id: number;
  student_name?: string;
  section_id?: number | null;
  title: string;
  content: string;
  variables: Record<string, string>;
  design?: CertificateDesignConfig | null;
  design_id?: string | null;
  context: string;
  context_date?: string | null;
  issued_at?: string | null;
  is_custom?: boolean;
}

export interface CertificationPreparePayload {
  template_id?: number | null;
  custom_title?: string;
  custom_content?: string;
  section_id?: number | null;
  student_ids?: number[];
  variables?: Record<string, string>;
  student_variables?: Record<number, Record<string, string>>;
  context?: string;
  context_date?: string | null;
}

export interface CertificationPreview {
  template_id?: number | null;
  student_id: number;
  student_name: string;
  section_id?: number | null;
  title: string;
  content: string;
  variables: Record<string, string>;
  design?: CertificateDesignConfig | null;
  design_id?: string | null;
  context: string;
  context_date?: string | null;
  is_custom: boolean;
}

export interface CertificationPrepareResponse {
  template: CertificationTemplate | null;
  certifications: CertificationPreview[];
  counts: { ready: number; total: number };
}

export interface CertificationIssueResponse {
  message: string;
  certifications: StudentCertification[];
  counts: { issued: number };
}

const mockTemplates: CertificationTemplate[] = [
  {
    id: 1,
    title: 'Certificate of Completion',
    content: 'CERTIFICATE OF COMPLETION\n\nThis is to certify that\n\n{{student_name}}\n\nhas successfully completed {{section_name}}\n\nDate: {{date}}',
    variables: ['student_name', 'section_name', 'date', 'center_name'],
    is_system: true,
  },
  {
    id: 2,
    title: 'Certificate of Excellence',
    content: 'CERTIFICATE OF EXCELLENCE\n\nAwarded to {{student_name}}\n\nScore: {{degree}}\nSection: {{section_name}}\nDate: {{date}}',
    variables: ['student_name', 'section_name', 'degree', 'date', 'center_name'],
    is_system: true,
  },
  {
    id: 3,
    title: 'Certificate of Achievement',
    content: 'CERTIFICATE OF ACHIEVEMENT\n\nPresented to {{student_name}}\n\nfor remarkable progress in {{section_name}}\n\nDate: {{date}}',
    variables: ['student_name', 'section_name', 'date', 'center_name'],
    is_system: true,
  },
];

const mockIssued: StudentCertification[] = [];

export const adminCertificationsApi = {
  async listTemplates(): Promise<CertificationTemplate[]> {
    if (USE_MOCK) return mockTemplates;
    const res = await apiClient.get<{ templates: CertificationTemplate[] }>('/admin/certifications/templates', undefined, false);
    return res.templates;
  },

  async createTemplate(payload: Pick<CertificationTemplate, 'title' | 'content'> & {
    variables?: string[];
    design_id?: string | null;
    design?: CertificateDesignConfig | null;
  }): Promise<CertificationTemplate> {
    if (USE_MOCK) {
      const template: CertificationTemplate = {
        id: mockTemplates.length + 1,
        title: payload.title,
        content: payload.content,
        variables: payload.variables ?? [],
        is_system: false,
      };
      mockTemplates.push(template);
      return template;
    }
    const res = await apiClient.post<{ template: CertificationTemplate }>('/admin/certifications/templates', payload, false);
    return res.template;
  },

  async updateTemplate(
    id: number,
    payload: Pick<CertificationTemplate, 'title' | 'content'> & {
      variables?: string[];
      design_id?: string | null;
      design?: CertificateDesignConfig | null;
    },
  ): Promise<CertificationTemplate> {
    if (USE_MOCK) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Template not found');
      mockTemplates[index] = { ...mockTemplates[index], ...payload };
      return mockTemplates[index];
    }
    const res = await apiClient.put<{ template: CertificationTemplate }>(`/admin/certifications/templates/${id}`, payload, false);
    return res.template;
  },

  async deleteTemplate(id: number): Promise<void> {
    if (USE_MOCK) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index !== -1) mockTemplates.splice(index, 1);
      return;
    }
    await apiClient.delete(`/admin/certifications/templates/${id}`, false);
  },

  async listIssued(params?: { section_id?: number; student_id?: number }): Promise<StudentCertification[]> {
    if (USE_MOCK) return mockIssued;
    const res = await apiClient.get<{ certifications: StudentCertification[] }>(
      '/admin/certifications/issued',
      params,
      false,
    );
    return res.certifications;
  },

  async prepare(payload: CertificationPreparePayload): Promise<CertificationPrepareResponse> {
    if (USE_MOCK) {
      const template = payload.template_id
        ? mockTemplates.find(t => t.id === payload.template_id) ?? null
        : {
            id: 0,
            title: payload.custom_title ?? 'Custom',
            content: payload.custom_content ?? '',
            variables: [],
          };
      return {
        template,
        certifications: (payload.student_ids ?? [1]).map((sid, i) => ({
          template_id: template?.id ?? null,
          student_id: sid,
          student_name: `Student ${i + 1}`,
          section_id: payload.section_id ?? null,
          title: template?.title ?? 'Certificate',
          content: (template?.content ?? '').replace(/\{\{(\w+)\}\}/g, (_, key: string) => payload.variables?.[key] ?? `[${key}]`),
          variables: payload.variables ?? {},
          context: payload.context ?? 'manual',
          context_date: payload.context_date ?? null,
          is_custom: !payload.template_id,
        })),
        counts: { ready: payload.student_ids?.length ?? 1, total: payload.student_ids?.length ?? 1 },
      };
    }
    return apiClient.post<CertificationPrepareResponse>('/admin/certifications/prepare', payload, false);
  },

  async issue(payload: CertificationPreparePayload): Promise<CertificationIssueResponse> {
    if (USE_MOCK) {
      const prepared = await this.prepare(payload);
      const issued = prepared.certifications.map((c, i) => ({
        id: mockIssued.length + i + 1,
        ...c,
        issued_at: new Date().toISOString(),
      }));
      mockIssued.push(...issued);
      return { message: 'Certifications issued', certifications: issued, counts: { issued: issued.length } };
    }
    return apiClient.post<CertificationIssueResponse>('/admin/certifications/issue', payload, false);
  },

  async deleteIssued(id: number): Promise<void> {
    if (USE_MOCK) {
      const index = mockIssued.findIndex(c => c.id === id);
      if (index !== -1) mockIssued.splice(index, 1);
      return;
    }
    await apiClient.delete(`/admin/certifications/issued/${id}`, false);
  },
};
