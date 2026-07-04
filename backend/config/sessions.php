<?php

return [

    'jitsi' => [
        'base_url' => rtrim(env('JITSI_BASE_URL', 'https://meet.jit.si'), '/'),
    ],

    'livekit' => [
        'url' => env('LIVEKIT_URL', ''),
        'api_key' => env('LIVEKIT_API_KEY', ''),
        'api_secret' => env('LIVEKIT_API_SECRET', ''),
    ],

];
