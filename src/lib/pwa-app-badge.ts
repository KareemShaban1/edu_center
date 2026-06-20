/** Home-screen / app-icon unread badge (Badging API). Works on installed PWAs (Android, some desktop). */

export function isAppBadgeSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
}

export async function syncAppBadge(unreadCount: number): Promise<void> {
  if (!isAppBadgeSupported()) return;

  const count = Math.max(0, Math.floor(unreadCount));

  try {
    if (count > 0) {
      await navigator.setAppBadge(count);
    } else if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
    }
  } catch {
    // Installed PWA only; ignore when unsupported or denied.
  }
}
