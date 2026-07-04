/* Web Push handlers for EduCenter PWA — imported by the Workbox service worker */

function setAppBadgeCount(count) {
  var n = Math.max(0, count | 0);
  try {
    if ('setAppBadge' in navigator) {
      return n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge();
    }
    if (self.registration && 'setAppBadge' in self.registration) {
      return n > 0
        ? self.registration.setAppBadge(n)
        : self.registration.clearAppBadge();
    }
  } catch (e) {
    /* installed PWA only */
  }
  return Promise.resolve();
}

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'New Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'New Notification';
  const defaultIcon = '/pwa-192.png';
  const defaultBadge = '/pwa-badge.png';

  const options = {
    body: data.body || data.message || 'You have a new notification.',
    icon: data.icon || defaultIcon,
    tag: data.type || 'general',
    renotify: true,
    data: {
      url: data.url || '/',
      type: data.type || 'general',
      unread_count: data.unread_count,
    },
  };

  // Android tray icon: monochrome badge only — never use the color app icon here (white square).
  if (data.badge) {
    options.badge = data.badge;
  } else if (defaultBadge) {
    options.badge = defaultBadge;
  }

  const badgePromise =
    typeof data.unread_count === 'number'
      ? setAppBadgeCount(data.unread_count)
      : Promise.resolve();

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      badgePromise,
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
        clients.forEach(function (client) {
          client.postMessage({ type: 'PUSH_RECEIVED', payload: data });
        });
      }),
    ])
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', url });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
