window._ = require("lodash");
window.axios = require("axios");
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔹 Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyC54HG-Q55wl4VTpAVwQdIQ9HxIXJIxHTg",
    authDomain: "edu-center-40614.firebaseapp.com",
    projectId: "edu-center-40614",
    storageBucket: "edu-center-40614.firebasestorage.app",
    messagingSenderId: "618534190782",
    appId: "1:618534190782:web:9d956a99a0edff23a368ef",
    measurementId: "G-K6TNXYBDZM"
};

// 🔹 Init Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// ====== 🔔 Notification + Sound Setup ======
// let audioUnlocked = false;
// const notificationSound = new Audio('/sounds/notify.mp3');
// notificationSound.load();

// function unlockAudio() {
//     if (!audioUnlocked) {
//         notificationSound.play().then(() => {
//             audioUnlocked = true;
//             console.log("🔓 Audio unlocked");
//         }).catch(() => { /* ignore */ });
//     }
// }

// ['click', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
//     document.addEventListener(evt, unlockAudio, { once: true });
// });

// ====== 🔔 Handle Notification UI ======
const handleNotification = (notification) => {
    // Show browser notification
    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: notification.body,
            icon: "/images/icon.png"
        });
    }

    // Play sound
    // if (audioUnlocked) {
    //     notificationSound.currentTime = 0;
    //     notificationSound.play().catch(err => console.warn('🔇 Audio error:', err));
    // }

    // Update count
    const countElements = document.getElementsByClassName('nm-count');
    let currentCount = parseInt(countElements[0]?.innerText || '0');
    let updatedCount = currentCount + 1;
    for (let el of countElements) el.innerText = updatedCount;

    // Append to list
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

    // Toastr popup
    toastr["info"](notification.body, notification.title);
};

// ====== 🔹 Get FCM Token & Send to Laravel ======
console.log(parentId)
function initializeFCM() {
    if (!parentId) return;
    
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("Notification permission granted");
            
            getToken(messaging, { vapidKey })
                .then(currentToken => {
                    if (currentToken) {
                        console.log("FCM Token:", currentToken);
                        axios.post("/save-fcm-token", { 
                            token: currentToken 
                        }).catch(err => {
                            console.error("Failed to save token:", err);
                        });
                    } else {
                        console.warn("No registration token available");
                    }
                })
                .catch(err => {
                    console.error("FCM Token Error:", err);
                    if (err.code === 'messaging/permission-blocked') {
                        console.warn("Notifications are blocked by the user");
                    }
                });
        } else {
            console.warn("Notification permission denied");
        }
    });
}

// Handle service worker registration
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(registration => {
            console.log('Service Worker registered');
            initializeFCM();
        })
        .catch(err => {
            console.error('Service Worker registration failed:', err);
        });
} else {
    console.warn('Service Workers not supported');
}
// ====== 🔹 Handle Foreground Push Notifications ======
onMessage(messaging, payload => {
    console.log("📩 Message received:", payload);
    if (payload.notification) {
        handleNotification({
            title: payload.notification.title,
            body: payload.notification.body
        });
    }
});


// ====== 🔹 Click Event Handlers ======
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
