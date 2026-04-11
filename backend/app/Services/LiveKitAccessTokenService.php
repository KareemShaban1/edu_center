<?php

namespace App\Services;

final class LiveKitAccessTokenService
{
    public static function isConfigured(): bool
    {
        $key = (string) config('meetings.livekit.api_key');
        $secret = (string) config('meetings.livekit.api_secret');

        return $key !== '' && $secret !== '';
    }

    public static function createToken(
        string $roomName,
        string $identity,
        bool $canPublish,
        bool $allowRoomRecord,
        int $ttlSeconds = 21600
    ): string {
        $apiKey = (string) config('meetings.livekit.api_key');
        $apiSecret = (string) config('meetings.livekit.api_secret');
        if ($apiKey === '' || $apiSecret === '') {
            throw new \RuntimeException('LiveKit API credentials are not configured.');
        }

        $now = time();
        $video = [
            'room' => $roomName,
            'roomJoin' => true,
            'canPublish' => $canPublish,
            'canSubscribe' => true,
        ];
        if ($allowRoomRecord) {
            $video['roomRecord'] = true;
        }

        $payload = [
            'iss' => $apiKey,
            'sub' => $identity,
            'nbf' => $now,
            'exp' => $now + $ttlSeconds,
            'video' => $video,
        ];

        return JwtHs256::encode($payload, $apiSecret);
    }
}
