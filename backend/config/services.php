<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'fcm' => [
    'server_key' => env('FCM_SERVER_KEY'),
    'vapid_key' => env('FCM_VAPID_KEY'),
],

'webpush' => [
    'vapid' => [
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
        'subject' => env('APP_URL'),
    ],
    'icon' => env('WEBPUSH_ICON', '/pwa-192.png'),
    'badge' => env('WEBPUSH_BADGE', '/pwa-badge.png'),
],

'whatsapp' => [
    'mode' => env('WHATSAPP_MODE', 'link'),
    'default_country_code' => env('WHATSAPP_DEFAULT_COUNTRY_CODE', '20'),
    'base_url' => env('WHATSAPP_BASE_URL'),
    'instance' => env('WHATSAPP_INSTANCE'),
    'api_key' => env('WHATSAPP_API_KEY'),
    'send_delay_ms' => (int) env('WHATSAPP_SEND_DELAY_MS', 1500),
],

];
