<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    /**
     * Send notification to single device
     *
     * @param string $title
     * @param string $body
     * @param string $token
     * @param array $data Additional data payload
     * @return bool
     */
    public static function sendToDevice(string $title, string $body, string $token, array $data = []): bool
    {
        $serverKey = config('services.fcm.server_key');
        
        if (empty($serverKey)) {
            Log::error('FCM Server Key not configured');
            return false;
        }

        if (empty($token)) {
            Log::error('FCM Token is empty');
            return false;
        }

        $payload = [
            'to' => $token,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'icon' => config('services.fcm.notification_icon', '/images/notification.png'),
                'click_action' => config('services.fcm.click_action', config('app.url'))
            ],
            'data' => $data
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(10) // 10 second timeout
            ->post('https://fcm.googleapis.com/fcm/send', $payload);

            $responseData = $response->json();

            if ($response->successful()) {
                Log::info('FCM Notification Sent', [
                    'token' => $token,
                    'response' => $responseData,
                    'payload' => $payload
                ]);
                return true;
            }

            Log::error('FCM Request Failed', [
                'status' => $response->status(),
                'response' => $responseData,
                'payload' => $payload
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('FCM Exception: ' . $e->getMessage(), [
                'token' => $token,
                'error' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Send notification to multiple devices
     *
     * @param string $title
     * @param string $body
     * @param array $tokens
     * @param array $data
     * @return bool
     */
    public static function sendToMultipleDevices(string $title, string $body, array $tokens, array $data = []): bool
    {
        if (count($tokens) === 0) {
            Log::error('FCM: No tokens provided');
            return false;
        }

        $serverKey = config('services.fcm.server_key');
        
        $payload = [
            'registration_ids' => $tokens,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'icon' => config('services.fcm.notification_icon', '/images/notification.png'),
                'click_action' => config('services.fcm.click_action', config('app.url'))
            ],
            'data' => $data
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])
            ->post('https://fcm.googleapis.com/fcm/send', $payload);

            $responseData = $response->json();

            if ($response->successful()) {
                Log::info('FCM Batch Notification Sent', [
                    'token_count' => count($tokens),
                    'response' => $responseData
                ]);
                return true;
            }

            Log::error('FCM Batch Request Failed', [
                'status' => $response->status(),
                'response' => $responseData
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('FCM Batch Exception: ' . $e->getMessage());
            return false;
        }
    }
}