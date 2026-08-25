import { apiClient, USE_MOCK } from '../api-client';

export interface AttendanceQrVenue {
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number | null;
  location: string;
  configured: boolean;
}

export interface AttendanceQrToken {
  session_id: number;
  topic: string;
  start_at: string;
  duration: number;
  section_id: number;
  window_seconds: number;
  expires_in: number;
  payload: string;
  venue: AttendanceQrVenue;
}

export interface AttendanceCheckInResult {
  status: 'present' | 'late';
  attendance_id: number;
  checked_in_at: string;
  distance_m: number | null;
}

export interface AttendanceVenuePayload {
  latitude: number;
  longitude: number;
  geofence_radius_m?: number;
}

export interface AttendanceCheckInPayload {
  payload: string;
  latitude: number;
  longitude: number;
  accuracy_m?: number | null;
  center_id?: number | null;
}

export const attendanceQrApi = {
  async getAdminToken(sessionId: number): Promise<AttendanceQrToken> {
    if (USE_MOCK) {
      return {
        session_id: sessionId,
        topic: 'Mock',
        start_at: new Date().toISOString(),
        duration: 60,
        section_id: 1,
        window_seconds: 30,
        expires_in: 30,
        payload: JSON.stringify({ v: 1, s: sessionId, w: 1, t: 'mock' }),
        venue: { latitude: null, longitude: null, geofence_radius_m: 150, location: '', configured: false },
      };
    }
    return apiClient.get(`/admin/sessions/${sessionId}/attendance-qr`, undefined, false);
  },

  async setAdminVenue(sessionId: number, payload: AttendanceVenuePayload): Promise<{ venue: AttendanceQrVenue }> {
    if (USE_MOCK) {
      return {
        venue: {
          latitude: payload.latitude,
          longitude: payload.longitude,
          geofence_radius_m: payload.geofence_radius_m ?? 150,
          location: '',
          configured: true,
        },
      };
    }
    return apiClient.put(`/admin/sessions/${sessionId}/attendance-venue`, payload, false);
  },

  async getTeacherToken(sessionId: number): Promise<AttendanceQrToken> {
    if (USE_MOCK) {
      return attendanceQrApi.getAdminToken(sessionId);
    }
    return apiClient.get(`/teacher/sessions/${sessionId}/attendance-qr`, undefined, false);
  },

  async setTeacherVenue(sessionId: number, payload: AttendanceVenuePayload): Promise<{ venue: AttendanceQrVenue }> {
    if (USE_MOCK) {
      return attendanceQrApi.setAdminVenue(sessionId, payload);
    }
    return apiClient.put(`/teacher/sessions/${sessionId}/attendance-venue`, payload, false);
  },

  async studentCheckIn(payload: AttendanceCheckInPayload): Promise<AttendanceCheckInResult> {
    if (USE_MOCK) {
      return {
        status: 'present',
        attendance_id: 1,
        checked_in_at: new Date().toISOString(),
        distance_m: 12,
      };
    }
    return apiClient.post('/student/attendance/check-in', payload, false);
  },
};
