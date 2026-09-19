import { apiClient, USE_MOCK } from '../api-client';
import type {
  ChatContact,
  ChatConversation,
  ChatMessage,
  ChatRole,
} from '@/types/chat';

export interface ChatConversationsResponse {
  conversations: ChatConversation[];
  unread_count: number;
}

export interface ChatMessagesResponse {
  messages: ChatMessage[];
  next_cursor: number | null;
}

export const chatApi = {
  async contacts(params?: { q?: string; center_id?: number }): Promise<ChatContact[]> {
    if (USE_MOCK) return [];
    const query: Record<string, string | number> = {};
    if (params?.q) query.q = params.q;
    if (params?.center_id) query.center_id = params.center_id;
    const res = await apiClient.get<{ contacts: ChatContact[] }>('/chat/contacts', query, false);
    return res.contacts;
  },

  async conversations(): Promise<ChatConversationsResponse> {
    if (USE_MOCK) return { conversations: [], unread_count: 0 };
    return apiClient.get<ChatConversationsResponse>('/chat/conversations', undefined, false);
  },

  async unreadCount(): Promise<number> {
    if (USE_MOCK) return 0;
    const res = await apiClient.get<{ unread_count: number }>('/chat/unread', undefined, false);
    return res.unread_count ?? 0;
  },

  async startDirect(peer: { type: ChatRole; id: number; center_id: number }): Promise<ChatConversation> {
    const res = await apiClient.post<{ conversation: ChatConversation }>(
      '/chat/conversations',
      { type: 'direct', peer_type: peer.type, peer_id: peer.id, center_id: peer.center_id },
      false,
    );
    return res.conversation;
  },

  async startGroup(payload: {
    title: string;
    center_id: number;
    members: Array<{ type: ChatRole; id: number }>;
  }): Promise<ChatConversation> {
    const res = await apiClient.post<{ conversation: ChatConversation }>(
      '/chat/conversations',
      { type: 'group', ...payload },
      false,
    );
    return res.conversation;
  },

  async conversation(id: number): Promise<ChatConversation> {
    const res = await apiClient.get<{ conversation: ChatConversation }>(`/chat/conversations/${id}`, undefined, false);
    return res.conversation;
  },

  async messages(id: number, params?: { before_id?: number; limit?: number }): Promise<ChatMessagesResponse> {
    const query: Record<string, string | number> = {};
    if (params?.before_id) query.before_id = params.before_id;
    if (params?.limit) query.limit = params.limit;
    return apiClient.get<ChatMessagesResponse>(`/chat/conversations/${id}/messages`, query, false);
  },

  async sendText(id: number, type: 'text' | 'emoji', body: string): Promise<ChatMessage> {
    const res = await apiClient.post<{ message: ChatMessage }>(
      `/chat/conversations/${id}/messages`,
      { type, body },
      false,
    );
    return res.message;
  },

  async sendFile(id: number, type: 'image' | 'voice', file: File): Promise<ChatMessage> {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    const res = await apiClient.upload<{ message: ChatMessage }>(`/chat/conversations/${id}/messages`, form, false);
    return res.message;
  },

  async markRead(id: number, messageId?: number): Promise<void> {
    await apiClient.post(`/chat/conversations/${id}/read`, messageId ? { message_id: messageId } : {}, false);
  },

  async typing(id: number): Promise<void> {
    await apiClient.post(`/chat/conversations/${id}/typing`, {}, false);
  },

  attachmentUrl(conversationId: number, mediaId: number): string {
    return `/chat/conversations/${conversationId}/attachment/${mediaId}`;
  },

  async attachmentBlob(conversationId: number, mediaId: number): Promise<Blob> {
    return apiClient.getBlob(this.attachmentUrl(conversationId, mediaId), false);
  },

  openStream(lastId: number): Promise<Response> {
    return apiClient.openStream(`/chat/stream?last_id=${lastId}`, false);
  },
};
