<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait ResolvesPlatformApiContext
{
    use ResolvesCenterApiContext;

    /**
     * @return array{error: JsonResponse|null, centralConnection: string, authUserId: int|null}
     */
    protected function resolvePlatformContext(Request $request): array
    {
        $guard = $request->session()->get('api_auth_guard', 'platform_admin');
        if ($guard !== 'platform_admin') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403), 'centralConnection' => $this->centralConnection(), 'authUserId' => null];
        }

        $authUserId = Auth::guard('platform_admin')->id() ?? $request->session()->get('api_auth_user_id');
        if (! $authUserId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401), 'centralConnection' => $this->centralConnection(), 'authUserId' => null];
        }

        return ['error' => null, 'centralConnection' => $this->centralConnection(), 'authUserId' => (int) $authUserId];
    }
}
