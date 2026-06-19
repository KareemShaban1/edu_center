import { apiClient, USE_MOCK } from '../api-client';
import { mockNotifications } from '../mock-data';
import type { Notification, NotificationListResponse } from '@/types/models';

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
};
