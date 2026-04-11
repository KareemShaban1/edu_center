import { apiClient, USE_MOCK } from '../api-client';
import { mockNotifications } from '../mock-data';
import type { Notification } from '@/types/models';

export const notificationsApi = {
  async list(): Promise<Notification[]> {
    if (USE_MOCK) return mockNotifications;
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
};
