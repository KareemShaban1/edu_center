<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class ApiBearerAuth
{
    /** @param int|string|null $tenantId Stancl tenants use UUID strings. */
    public static function issue(string $guard, int $userId, int|string|null $tenantId, ?string $tenantSlug): string
    {
        $ttl = (int) config('session.lifetime', 120);

        $payload = [
            'guard' => $guard,
            'user_id' => $userId,
            'tenant_id' => $tenantId !== null && $tenantId !== '' ? (string) $tenantId : null,
            'tenant_slug' => $tenantSlug,
            'exp' => now()->addMinutes($ttl > 0 ? $ttl : 120)->getTimestamp(),
        ];

        return Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR));
    }

    public static function revoke(?string $token): void
    {
        // Stateless encrypted tokens expire automatically; session logout still applies.
    }

    /** @return array{guard: string, user_id: int, tenant_id: ?string, tenant_slug: ?string}|null */
    public static function resolve(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (! $token || $token === 'session-auth') {
            return null;
        }

        try {
            $decoded = json_decode(Crypt::decryptString($token), true, 512, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            return null;
        }

        if (! is_array($decoded) || empty($decoded['user_id'])) {
            return null;
        }

        if ((int) ($decoded['exp'] ?? 0) < time()) {
            return null;
        }

        $tenantId = $decoded['tenant_id'] ?? null;

        return [
            'guard' => (string) ($decoded['guard'] ?? 'web'),
            'user_id' => (int) $decoded['user_id'],
            'tenant_id' => $tenantId !== null && $tenantId !== '' ? (string) $tenantId : null,
            'tenant_slug' => isset($decoded['tenant_slug']) ? (string) $decoded['tenant_slug'] : null,
        ];
    }
}
