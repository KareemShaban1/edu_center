import { apiClient, USE_MOCK } from '../api-client';
import { mockNotifications } from '../mock-data';
import type { CenterSentNotificationListResponse, Notification, NotificationListResponse } from '@/types/models';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface AdminSendNotificationPayload {
  title: string;
  body: string;
  audience: 'students' | 'parents' | 'both';
  section_id?: number | null;
  student_ids?: number[];
  parent_ids?: number[];
  url?: string | null;
  send_push?: boolean;
}

export const notificationsApi = {
  async list(): Promise<NotificationListResponse> {
    if (USE_MOCK) {
      return {
        notifications: mockNotifications,
        unread_count: mockNotifications.filter(n => !n.read_at).length,
      };
    }
    return apiClient.get('/notifications');
  },

  async markRead(id: string): Promise<void> {
    if (USE_MOCK) return;
    return apiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    if (USE_MOCK) return;
    return apiClient.post('/notifications/mark-all-read');
  },

  async getVapidKey(): Promise<{ publicKey: string | null }> {
    if (USE_MOCK) return { publicKey: null };
    return apiClient.get('/notifications/vapid-key');
  },

  async subscribe(subscription: PushSubscriptionPayload): Promise<void> {
    if (USE_MOCK) return;
    return apiClient.post('/notifications/subscribe', { subscription });
  },

  async adminSend(payload: AdminSendNotificationPayload): Promise<{ sent: { students: number; parents: number } }> {
    if (USE_MOCK) {
      return { sent: { students: 1, parents: 1 } };
    }
    return apiClient.post('/admin/notifications/send', payload);
  },

  async adminList(limit = 100): Promise<CenterSentNotificationListResponse> {
    if (USE_MOCK) {
      return {
        total: 2,
        notifications: [
          {
            id: 'mock-1',
            notification_type: 'ManualNotification',
            channel_type: 'manual',
            title: 'Exam reminder',
            body: 'Final exam starts tomorrow at 9 AM.',
            url: '/student/announcements',
            audience: 'both',
            section_id: 1,
            grade_name: 'Grade 10',
            class_name: 'Class A',
            section_name: 'Section 1',
            send_push: true,
            source: 'manual',
            sent_at: new Date().toISOString(),
            recipients_count: 42,
            students_count: 25,
            parents_count: 17,
            read_count: 30,
          },
          {
            id: 'mock-2',
            notification_type: 'StudentAttendanceNotification',
            channel_type: 'attendance',
            title: 'Attendance update',
            body: 'Your child was marked present on 2026-07-12.',
            url: null,
            audience: null,
            section_id: null,
            grade_name: null,
            class_name: null,
            section_name: null,
            send_push: null,
            source: null,
            sent_at: new Date(Date.now() - 86400000).toISOString(),
            recipients_count: 1,
            students_count: 0,
            parents_count: 1,
            read_count: 0,
          },
        ],
      };
    }
    return apiClient.get(`/admin/notifications?limit=${limit}`);
  },
};
