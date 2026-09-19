<?php

declare(strict_types=1);

return [
    'image_max_kb' => 5120,
    'voice_max_kb' => 8192,
    'voice_max_seconds' => 120,
    'send_per_minute' => 30,
    'sse_seconds' => 25,
    'sse_poll_ms' => 800,
    'image_mimes' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    'voice_mimes' => [
        'audio/webm',
        'audio/mp4',
        'audio/mpeg',
        'audio/ogg',
        'audio/wav',
        'audio/x-wav',
        'video/webm',
    ],
];
