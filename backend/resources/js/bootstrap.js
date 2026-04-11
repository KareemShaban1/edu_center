window._ = require("lodash");

try {
    window.Popper = require("popper.js").default;
    window.$ = window.jQuery = require("jquery");

    require("bootstrap");
} catch (e) { }


window.axios = require("axios");
window.axios.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

//Pusher.logToConsole = true;
window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'pusher',
    key: '2a47ebb48a2ee5969336',
    cluster: 'eu',
    forceTLS: true,
    auth: {
        headers: {
            'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
        },
    },
});





