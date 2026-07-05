const SESSION_KEY = 'edu_developer_access_granted';

/** Gate password for `/developer/login` (set VITE_DEVELOPER_ACCESS_PASSWORD in production). */
export function getDeveloperAccessPassword(): string {
  const configured = import.meta.env.VITE_DEVELOPER_ACCESS_PASSWORD?.trim();
  if (configured) return configured;
  if (import.meta.env.DEV) return 'developer';
  return 'developer';
}

export function hasDeveloperAccess(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function grantDeveloperAccess(): void {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function revokeDeveloperAccess(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function verifyDeveloperAccessPassword(input: string): boolean {
  return input === getDeveloperAccessPassword();
}
