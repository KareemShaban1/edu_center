window._ = require("lodash");
window.axios = require("axios");
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

window.axios = require("axios");
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: process.env.MIX_PUSHER_APP_KEY,
    forceTLS: true,
    cluster: 'eu',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
    }
});


// ====== 🔔 Notification + Sound Setup ======
const handleNotification = (notification) => {

    // Show browser notification (if permission granted)
    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: notification.body,
            icon: "/images/icon.png"
        });
    }

    // Update notification count
    const countElements = document.getElementsByClassName('nm-count');
    let currentCount = parseInt(countElements[0]?.innerText || '0'); // Get from first element safely
    let updatedCount = currentCount + 1;

    // Update all nm-count elements
    for (let el of countElements) {
        el.innerText = updatedCount;
    }


    // Append to notification list
    const notificationElement = document.getElementById('nm-list');
    const now = new Date().toLocaleTimeString();
    notificationElement.innerHTML = `
    <li>
        <a class="dropdown-item text-danger">
            <h6>${notification.title}</h6>
            <p>${notification.body}</p>
            <small class="float-right text-muted">${now}</small>
        </a>
    </li>` + notificationElement.innerHTML;


    // Toastr
    toastr["info"](notification.body, notification.title);
};


// ====== 🔹 Web Push Registration ======
if (parentId) {
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            registerServiceWorker();
        }
    });
}

// Updated registerServiceWorker function
async function registerServiceWorker() {
    try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered');

        // Attach message listener here so we are sure SW is active
        navigator.serviceWorker.addEventListener('message', function (event) {
            if (event.data && event.data.type === 'PUSH_RECEIVED') {
                console.log('Message from SW:', event.data);
                updateNotificationCount(event.data.payload);
            }
        });

        // Get VAPID key from server
        const response = await axios.get('/vapid-key');
        const vapidPublicKey = response.data.publicKey;

        if (!vapidPublicKey || typeof vapidPublicKey !== 'string') {
            throw new Error('Invalid VAPID public key received from server');
        }

        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
        });

        console.log('Push subscription successful:', subscription);

        await axios.post('/subscribe', { subscription });

        console.log('Subscription saved to server');

    } catch (error) {
        console.error('Service Worker registration failed:', error);
        toastr.error('Notification setup failed: ' + error.message);
    }
}


// Helper function for VAPID key conversion
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function updateNotificationCount(data) {
    console.log(data)
    const countEl = document.getElementById('notification-count');
    let currentCount = parseInt(countEl.textContent) || 0;
    countEl.textContent = currentCount + 1;
}





const channels = [`parent.${userId}`, `student.${userId}`];

console.log(channels)
channels.forEach(channel => {

    window.Echo.private(channel)
        .notification((notification) => {

            handleNotification(notification);
        })
        .error(error => {
            // console.error('❌ Echo subscription error:', error);
        });
});


// ====== 🔹 Click Event Handlers ====== 
// (Keep your existing click handlers as they are)
let notificationsPage = 1;

document.addEventListener('click', function (e) {
    const item = e.target.closest('.notification-item');
    if (item) {
        const id = item.closest('li').dataset.id;
        axios.post(`/notifications/${id}/read`).then(res => {
            item.classList.remove('text-danger');
            document.querySelectorAll('.nm-count').forEach(el => {
                el.innerText = res.data.unread_count;
            });
        });
        e.preventDefault();
    }

    if (e.target.id === 'load-more-notifications') {
        notificationsPage++;
        axios.get(`/notifications?page=${notificationsPage}`).then(response => {
            const list = document.getElementById('nm-list');
            response.data.notifications.forEach(n => {
                const li = document.createElement('li');
                li.dataset.id = n.id;
                li.innerHTML = `
                    <a href="#" class="dropdown-item notification-item ${n.read_at === null ? 'text-danger' : ''}">
                        ${n.data.body}
                        <small class="float-right text-muted time">${n.created_at_human}</small>
                    </a>`;
                list.appendChild(li);
            });

            if (!response.data.hasMore) {
                document.getElementById('load-more-notifications').remove();
            }
        });
    }

    if (e.target.id === 'mark-all-read') {
        axios.post('/notifications/mark-all-read').then(() => {
            document.querySelectorAll('.notification-item').forEach(el => el.classList.remove('text-danger'));
            document.querySelectorAll('.nm-count').forEach(el => el.innerText = '0');
        });
    }


    
});