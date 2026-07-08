import { apiClient, USE_MOCK } from '../api-client';

export interface WhatsAppTemplate {
  id: number;
  name: string;
  content: string;
  variables: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface WhatsAppPreparePayload {
  template_id: number;
  audience: 'students' | 'parents' | 'both';
  section_id?: number | null;
  student_ids?: number[];
  parent_ids?: number[];
  variables?: Record<string, string>;
  student_variables?: Record<number, Record<string, string>>;
}

export interface WhatsAppPreparedMessage {
  recipient_type: 'student' | 'parent';
  recipient_id: number;
  student_id?: number | null;
  student_name?: string;
  name: string;
  phone: string;
  message: string;
  whatsapp_url: string;
}

export interface WhatsAppPrepareResponse {
  template: WhatsAppTemplate;
  messages: WhatsAppPreparedMessage[];
  counts: {
    ready: number;
    skipped: number;
    total: number;
  };
}

export interface WhatsAppSendResult {
  recipient_type: 'student' | 'parent';
  recipient_id: number;
  student_id?: number | null;
  student_name?: string;
  name: string;
  phone: string;
  message: string;
  status: 'sent' | 'failed';
  error?: string | null;
}

export interface WhatsAppSendResponse {
  message: string;
  results: WhatsAppSendResult[];
  counts: {
    sent: number;
    failed: number;
    skipped: number;
  };
}

export interface WhatsAppStatusResponse {
  mode: 'link' | 'evolution' | string;
  automatic_available: boolean;
  evolution: {
    configured: boolean;
    connected: boolean;
    state: string | null;
    error: string | null;
  };
}

const mockTemplates: WhatsAppTemplate[] = [
  {
    id: 1,
    name: 'Attendance alert',
    content: 'Dear {{parent_name}}, your child {{student_name}} was {{status}} on {{date}} ({{section_name}}). Notes: {{notes}}',
    variables: ['parent_name', 'student_name', 'status', 'date', 'section_name', 'notes'],
  },
  {
    id: 2,
    name: 'Exam result',
    content: 'Dear {{parent_name}}, {{student_name}} scored {{degree}} in {{assessment_type}} on {{date}} ({{section_name}}). Status: {{status}} Note: {{notes}}',
    variables: ['parent_name', 'student_name', 'degree', 'assessment_type', 'date', 'section_name', 'status', 'notes'],
  },
  {
    id: 3,
    name: 'Quiz result',
    content: 'Dear {{parent_name}}, {{student_name}} scored {{degree}} in {{assessment_type}} on {{date}} ({{section_name}}).',
    variables: ['parent_name', 'student_name', 'degree', 'assessment_type', 'date', 'section_name'],
  },
];

export const adminWhatsAppApi = {
  async status(): Promise<WhatsAppStatusResponse> {
    if (USE_MOCK) {
      return {
        mode: 'link',
        automatic_available: false,
        evolution: { configured: false, connected: false, state: null, error: null },
      };
    }
    return apiClient.get<WhatsAppStatusResponse>('/admin/whatsapp/status', undefined, false);
  },

  async listTemplates(): Promise<WhatsAppTemplate[]> {
    if (USE_MOCK) {
      return mockTemplates;
    }
    const res = await apiClient.get<{ templates: WhatsAppTemplate[] }>('/admin/whatsapp/templates', undefined, false);
    return res.templates;
  },

  async createTemplate(payload: Pick<WhatsAppTemplate, 'name' | 'content'> & { variables?: string[] }): Promise<WhatsAppTemplate> {
    if (USE_MOCK) {
      const template: WhatsAppTemplate = {
        id: mockTemplates.length + 1,
        name: payload.name,
        content: payload.content,
        variables: payload.variables ?? [],
      };
      mockTemplates.push(template);
      return template;
    }
    const res = await apiClient.post<{ template: WhatsAppTemplate }>('/admin/whatsapp/templates', payload, false);
    return res.template;
  },

  async updateTemplate(
    id: number,
    payload: Pick<WhatsAppTemplate, 'name' | 'content'> & { variables?: string[] },
  ): Promise<WhatsAppTemplate> {
    if (USE_MOCK) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index === -1) throw new Error('Template not found');
      mockTemplates[index] = { ...mockTemplates[index], ...payload };
      return mockTemplates[index];
    }
    const res = await apiClient.put<{ template: WhatsAppTemplate }>(`/admin/whatsapp/templates/${id}`, payload, false);
    return res.template;
  },

  async deleteTemplate(id: number): Promise<void> {
    if (USE_MOCK) {
      const index = mockTemplates.findIndex(t => t.id === id);
      if (index !== -1) mockTemplates.splice(index, 1);
      return;
    }
    await apiClient.delete(`/admin/whatsapp/templates/${id}`, false);
  },

  async prepare(payload: WhatsAppPreparePayload): Promise<WhatsAppPrepareResponse> {
    if (USE_MOCK) {
      const template = mockTemplates.find(t => t.id === payload.template_id) ?? mockTemplates[0];
      return {
        template,
        messages: [
          {
            recipient_type: 'parent',
            recipient_id: 1,
            name: 'Ahmed Parent',
            phone: '2010123456789',
            message: template.content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => payload.variables?.[key] ?? `[${key}]`),
            whatsapp_url: 'https://wa.me/2010123456789?text=Hello',
          },
        ],
        counts: { ready: 1, skipped: 0, total: 1 },
      };
    }
    return apiClient.post<WhatsAppPrepareResponse>('/admin/whatsapp/prepare', payload, false);
  },

  async send(payload: WhatsAppPreparePayload): Promise<WhatsAppSendResponse> {
    if (USE_MOCK) {
      const prepared = await this.prepare(payload);
      return {
        message: 'WhatsApp messages processed',
        results: prepared.messages.map(item => ({
          recipient_type: item.recipient_type,
          recipient_id: item.recipient_id,
          name: item.name,
          phone: item.phone,
          message: item.message,
          status: 'sent',
          error: null,
        })),
        counts: { sent: prepared.messages.length, failed: 0, skipped: prepared.counts.skipped },
      };
    }
    return apiClient.post<WhatsAppSendResponse>('/admin/whatsapp/send', payload, false);
  },
};
