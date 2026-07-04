<?php

declare(strict_types=1);

namespace App\Http\Support;

final class SessionTypeHelper
{
    /** @return array{0: string, 1: string|null} */
    public static function resolveFromPayload(array $payload): array
    {
        if (! empty($payload['session_type'])) {
            $type = (string) $payload['session_type'];
            $provider = $type === 'online' ? ($payload['provider'] ?? null) : null;

            return [$type, is_string($provider) ? $provider : null];
        }

        $provider = (string) ($payload['provider'] ?? 'jitsi');
        if ($provider === 'offline') {
            return ['offline', null];
        }

        return ['online', $provider];
    }

    public static function validationRules(bool $requireSection = true): array
    {
        return [
            'session_type' => ['required', 'in:offline,online,exam,others'],
            'provider' => ['nullable', 'required_if:session_type,online', 'in:jitsi,livekit,external,offline,zoom,microsoft_teams,google_meet'],
        ];
    }
}
