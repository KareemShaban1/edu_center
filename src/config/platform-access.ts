const SESSION_KEY = 'edu_platform_access_granted';

/** Gate password for `/platform/login` (set VITE_PLATFORM_ACCESS_PASSWORD in production). */
export function getPlatformAccessPassword(): string {
  const configured = import.meta.env.VITE_PLATFORM_ACCESS_PASSWORD?.trim();
  if (configured) return configured;
  if (import.meta.env.DEV) return 'platform';
  return 'platform';
}

export function hasPlatformAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function grantPlatformAccess(): void {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function revokePlatformAccess(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function verifyPlatformAccessPassword(input: string): boolean {
  return input === getPlatformAccessPassword();
}
