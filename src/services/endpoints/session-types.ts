export type SessionType = 'offline' | 'online' | 'exam' | 'others';

export type SessionOnlineProvider =
  | 'jitsi'
  | 'livekit'
  | 'zoom'
  | 'microsoft_teams'
  | 'google_meet'
  | 'external';

export interface SessionOption {
  id: number;
  topic: string;
  start_at: string;
  session_type: SessionType;
}
