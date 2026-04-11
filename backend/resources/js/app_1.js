window._ = require("lodash");

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



// Check and request Notification permission
if ('Notification' in window) {
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('✅ Notification permission granted.');
            } else {
                console.warn('🚫 Notification permission denied.');
            }
        });
    }
} else {
    console.warn("🚫 This browser doesn't support system notifications.");
}

// Unlock audio on first user interaction
let audioUnlocked = false;
const notificationSound = new Audio('/sounds/notify.mp3');
notificationSound.load();

// Unlock audio on ANY interaction (click, key press, touch, scroll)
function unlockAudio() {
    if (!audioUnlocked) {
        notificationSound.play().then(() => {
            audioUnlocked = true;
            console.log("🔓 Audio unlocked, ready for real-time playback");
        }).catch(() => { /* ignore */ });
    }
}

['click', 'keydown', 'touchstart', 'scroll'].forEach(evt => {
    document.addEventListener(evt, unlockAudio, { once: true });
});


const handleNotification = (notification) => {

    // Show browser notification (if permission granted)
    if (Notification.permission === "granted") {
        new Notification(notification.title, {
            body: notification.body,
            icon: "/images/icon.png"
        });
    }

    // Play sound
    if (audioUnlocked) {
        notificationSound.currentTime = 0; // restart from start
        notificationSound.play().catch(err => {
            console.warn('🔇 Audio play failed:', err);
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




// Pusher.logToConsole = true;

const channels = [`parent.${userId}`, `student.${userId}`];

channels.forEach(channel => {

    window.Echo.private(channel)
        .notification((notification) => {

            handleNotification(notification);
        })
        .error(error => {
            // console.error('❌ Echo subscription error:', error);
        });
});


let notificationsPage = 1;

document.addEventListener('click', function (e) {
    const item = e.target.closest('.notification-item');
    if (item) {
        const id = item.closest('li').dataset.id;

        axios.post(`/notifications/${id}/read`).then(res => {
            // ✅ Remove red class from only the clicked notification
            item.classList.remove('text-danger');

            // ✅ Update count in all .nm-count spans
            document.querySelectorAll('.nm-count').forEach(el => {
                el.innerText = res.data.unread_count;
            });
        });

        e.preventDefault();
    }

    // 🔽 Load more notifications
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

    // ✅ Mark all as read
    if (e.target.id === 'mark-all-read') {
        axios.post('/notifications/mark-all-read').then(() => {
            document.querySelectorAll('.notification-item').forEach(el => el.classList.remove('text-danger'));
            document.querySelectorAll('.nm-count').forEach(el => el.innerText = '0');
        });
    }
});






