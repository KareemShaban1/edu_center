type TranslateFn = (key: string) => string;

const EXACT_MESSAGE_KEYS: Record<string, string> = {
  'Request failed': 'attendanceQr.error.requestFailed',
  'Geolocation is not supported on this device.': 'attendanceQr.error.geoUnsupported',
  'Unable to read GPS location.': 'attendanceQr.error.gpsUnreadable',
  'QR attendance is not available yet. Run migrations.': 'attendanceQr.error.notAvailable',
  'This QR code belongs to another center.': 'attendanceQr.error.wrongCenter',
  'QR code expired. Ask your teacher to show the live code again.': 'attendanceQr.error.qrExpired',
  'You are not enrolled in this session section.': 'attendanceQr.error.notEnrolled',
  'GPS accuracy is too low. Move near a window or outdoors and try again.': 'attendanceQr.error.gpsAccuracyLow',
  'Session venue is not set. Teacher must set location before QR check-in.': 'attendanceQr.error.venueNotSet',
  'You are outside the allowed attendance area.': 'attendanceQr.error.outsideArea',
  'You already checked in for this session.': 'attendanceQr.error.alreadyCheckedIn',
  'Sessions module unavailable': 'attendanceQr.error.sessionsUnavailable',
  'Session not found': 'attendanceQr.error.sessionNotFound',
  'Invalid QR code.': 'attendanceQr.error.invalidQr',
  'Session start time is missing.': 'attendanceQr.error.sessionTimeMissing',
  'Check-in is not open yet for this session.': 'attendanceQr.error.notOpenYet',
  'Check-in window for this session has closed.': 'attendanceQr.error.windowClosed',
};

export function attendanceStatusLabel(t: TranslateFn, status: string): string {
  const key = `attendance.${status}`;
  const translated = t(key);
  return translated !== key ? translated : status;
}

export function translateAttendanceError(message: string, t: TranslateFn): string {
  const trimmed = message.trim();
  if (!trimmed) return t('attendanceQr.error.requestFailed');

  const exactKey = EXACT_MESSAGE_KEYS[trimmed];
  if (exactKey) return t(exactKey);

  const lower = trimmed.toLowerCase();
  if (lower.includes('denied') || lower.includes('permission')) {
    return t('attendanceQr.error.geoDenied');
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return t('attendanceQr.error.geoTimeout');
  }
  if (lower.includes('unavailable') || lower.includes('position unavailable')) {
    return t('attendanceQr.error.geoUnavailable');
  }
  if (lower.includes('not allowed') || lower.includes('secure context')) {
    return t('attendanceQr.error.geoUnsupported');
  }
  if (lower.includes('camera') || lower.includes('notfounderror') || lower.includes('not readable')) {
    return t('attendanceQr.error.cameraUnavailable');
  }

  return trimmed;
}

export function translateAttendanceErrorFromUnknown(error: unknown, t: TranslateFn): string {
  if (error instanceof Error) {
    return translateAttendanceError(error.message, t);
  }
  if (typeof error === 'object' && error && 'message' in error) {
    return translateAttendanceError(String((error as { message: unknown }).message), t);
  }
  return t('attendanceQr.error.requestFailed');
}
