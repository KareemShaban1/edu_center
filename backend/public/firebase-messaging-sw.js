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
    const options = {
        body: data.body || 'You have a new notification.',
        icon: data.icon || '/icon.png',
        badge: data.badge || '/badge.png',
        data: data
    };

    // Show the notification
    event.waitUntil(
        self.registration.showNotification(title, options)
    );

    // Notify all clients (open browser tabs) that a push arrived
    event.waitUntil(
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function (clients) {
            clients.forEach(function (client) {
                client.postMessage({
                    type: 'PUSH_RECEIVED',
                    payload: data
                });
            });
        })
    );
});


self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'FORWARD_TO_PAGE') {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage(event.data.payload);
            });
        });
    }
});
