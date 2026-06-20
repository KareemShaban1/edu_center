<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Centers\CenterContextManager;
use App\Http\Support\ApiBearerAuth;
use App\Models\Platform\Center;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Re-hydrate Laravel session state from the encrypted API bearer token.
 * Required for SPA refresh when the session cookie is missing but the token is still valid.
 */
class RestoreApiSessionFromBearer
{
    public function handle(Request $request, Closure $next)
    {
        $bearer = ApiBearerAuth::resolve($request);

        if ($bearer) {
            $guard = (string) ($bearer['guard'] ?? 'web');
            $request->session()->put('api_auth_guard', $guard);

            if (! empty($bearer['portal'])) {
                $request->session()->put('api_portal_mode', true);
                $request->session()->put('api_profile_email', (string) ($bearer['profile_email'] ?? ''));
                if (! empty($bearer['user_type'])) {
                    $request->session()->put('api_profile_user_type', (string) $bearer['user_type']);
                }
                $request->session()->forget([
                    'api_tenant_id',
                    'api_tenant_slug',
                    'api_auth_user_id',
                ]);
            } else {
                $request->session()->forget('api_portal_mode');

                if (! empty($bearer['tenant_id'])) {
                    $request->session()->put('api_tenant_id', $bearer['tenant_id']);
                }
                if (! empty($bearer['tenant_slug'])) {
                    $request->session()->put('api_tenant_slug', $bearer['tenant_slug']);
                }
                if (! empty($bearer['profile_email'])) {
                    $request->session()->put('api_profile_email', $bearer['profile_email']);
                }
                if (! empty($bearer['user_type'])) {
                    $request->session()->put('api_profile_user_type', $bearer['user_type']);
                }

                $tenantId = $bearer['tenant_id'] ?? null;
                $tenantSlug = $bearer['tenant_slug'] ?? null;
                $userId = (int) ($bearer['user_id'] ?? 0);

                if ($userId > 0) {
                    $request->session()->put('api_auth_user_id', $userId);

                    $center = app(CenterContextManager::class)->resolve($tenantId, is_string($tenantSlug) ? $tenantSlug : null);

                    if ($center) {
                        app(CenterContextManager::class)->initialize($center);
                    }

                    if (! Auth::guard($guard)->check()) {
                        Auth::guard($guard)->loginUsingId($userId);
                    }
                }
            }
        }

        return $next($request);
    }
}
