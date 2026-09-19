export type ChatRole = 'admin' | 'teacher' | 'student' | 'parent';
export type ChatMessageType = 'text' | 'emoji' | 'image' | 'voice';
export type ChatConversationType = 'direct' | 'group';

export interface ChatContact {
  type: ChatRole;
  id: number;
  center_id: number;
  center_name: string | null;
  name: string;
  role: ChatRole;
}

export interface ChatParticipant {
  type: ChatRole;
  id: number;
  name: string;
  role: ChatRole;
  center_id?: number;
}

export interface ChatAttachment {
  id: number;
  file_name: string;
  mime_type: string | null;
  size: number;
  url: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_type: ChatRole;
  sender_id: number;
  type: ChatMessageType;
  body: string | null;
  is_mine?: boolean;
  created_at: string | null;
  attachment: ChatAttachment | null;
}

export interface ChatConversation {
  id: number;
  center_id: number;
  type: ChatConversationType;
  title: string | null;
  participants: ChatParticipant[];
  last_message: ChatMessage | null;
  unread_count: number;
  updated_at: string | null;
  can_manage: boolean;
}

export interface ChatTypingEvent {
  conversation_id: number;
  actors: Array<{ type: ChatRole; id: number | null; name: string }>;
}
