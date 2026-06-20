<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;

class ApiBearerAuth
{
    /** @param int|string|null $tenantId Stancl tenants use UUID strings. */
    public static function issue(
        string $guard,
        int $userId,
        int|string|null $tenantId,
        ?string $tenantSlug,
        ?string $profileEmail = null,
        ?string $userType = null,
    ): string {
        $ttlMinutes = (int) env('API_TOKEN_TTL_MINUTES', config('session.lifetime', 120));

        $payload = [
            'guard' => $guard,
            'user_id' => $userId,
            'tenant_id' => $tenantId !== null && $tenantId !== '' ? (string) $tenantId : null,
            'tenant_slug' => $tenantSlug,
            'profile_email' => $profileEmail,
            'user_type' => $userType,
            'exp' => now()->addMinutes($ttlMinutes > 0 ? $ttlMinutes : 120)->getTimestamp(),
        ];

        return Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR));
    }

    public static function revoke(?string $token): void
    {
        // Stateless encrypted tokens expire automatically; session logout still applies.
    }

    /** @return array{guard: string, user_id: int, tenant_id: ?string, tenant_slug: ?string, portal?: bool, profile_email?: string, user_type?: string}|null */
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

        if (! is_array($decoded)) {
            return null;
        }

        if ((int) ($decoded['exp'] ?? 0) < time()) {
            return null;
        }

        if (! empty($decoded['portal'])) {
            return [
                'guard' => (string) ($decoded['guard'] ?? 'parent'),
                'user_id' => 0,
                'tenant_id' => null,
                'tenant_slug' => null,
                'portal' => true,
                'profile_email' => (string) ($decoded['profile_email'] ?? ''),
                'user_type' => isset($decoded['user_type']) ? (string) $decoded['user_type'] : null,
            ];
        }

        if (empty($decoded['user_id'])) {
            return null;
        }

        $tenantId = $decoded['tenant_id'] ?? null;

        return [
            'guard' => (string) ($decoded['guard'] ?? 'web'),
            'user_id' => (int) $decoded['user_id'],
            'tenant_id' => $tenantId !== null && $tenantId !== '' ? (string) $tenantId : null,
            'tenant_slug' => isset($decoded['tenant_slug']) ? (string) $decoded['tenant_slug'] : null,
            'profile_email' => isset($decoded['profile_email']) ? (string) $decoded['profile_email'] : null,
            'user_type' => isset($decoded['user_type']) ? (string) $decoded['user_type'] : null,
        ];
    }

    public static function issuePortal(string $guard, string $profileEmail, string $userType): string
    {
        $ttlMinutes = (int) env('API_PORTAL_TOKEN_TTL_MINUTES', 60 * 24 * 7);

        $payload = [
            'portal' => true,
            'guard' => $guard,
            'profile_email' => $profileEmail,
            'user_type' => $userType,
            'exp' => now()->addMinutes($ttlMinutes > 0 ? $ttlMinutes : 10080)->getTimestamp(),
        ];

        return Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR));
    }
}
