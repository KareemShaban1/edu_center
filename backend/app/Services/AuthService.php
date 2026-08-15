<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContextManager;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\ApiGuardMaps;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

final class AuthService
{
    public function __construct(
        private readonly CenterContextManager $centerContext,
    ) {}

    public function logout(Request $request): JsonResponse
    {
        ApiBearerAuth::revoke($request->bearerToken());

        $guard = $request->session()->get('api_auth_guard', 'web');
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug');

        if (in_array($guard, ApiGuardMaps::TENANT_GUARDS, true)) {
            $tenant = $this->centerContext->resolve($tenantId, is_string($tenantSlug) ? $tenantSlug : null);
            if ($tenant) {
                $this->centerContext->initialize($tenant);
            }
        }

        Auth::guard($guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request): JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        $bearer = ApiBearerAuth::resolve($request);

        if ($bearer) {
            $guard = $bearer['guard'];
            if (! empty($bearer['portal'])) {
                $request->session()->put('api_portal_mode', true);
                $request->session()->put('api_auth_guard', $bearer['guard']);
                if (! empty($bearer['profile_email'])) {
                    $request->session()->put('api_profile_email', $bearer['profile_email']);
                }
                if (! empty($bearer['user_type'])) {
                    $request->session()->put('api_profile_user_type', $bearer['user_type']);
                }
            } elseif (! empty($bearer['profile_email'])) {
                $request->session()->put('api_profile_email', $bearer['profile_email']);
                if (! empty($bearer['user_type'])) {
                    $request->session()->put('api_profile_user_type', $bearer['user_type']);
                }
            }
        }

        if ($request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false)) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type') ?: ($bearer['user_type'] ?? null);
            if (! $email || ! $userType) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $identityName = $email;
            $profiles = DB::connection('center')->table(
                $userType === Student::class ? 'students' : 'parents'
            )->where('email', $email)->first();
            if ($profiles) {
                $identityName = $userType === Student::class
                    ? (string) ($profiles->name ?? $email)
                    : (string) ($profiles->parent_name ?? $email);
            }

            return response()->json([
                'user' => [
                    'id' => 0,
                    'name' => $identityName,
                    'email' => $email,
                    'role' => ApiGuardMaps::ROLE_MAP[$guard] ?? $guard,
                    'locale' => app()->getLocale(),
                    'created_at' => now()->toDateString(),
                    'portal_mode' => true,
                    'tenant_id' => null,
                    'tenant_slug' => null,
                    'tenant_name' => null,
                ],
            ]);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = null;

        if ($bearer) {
            $tenantId = $bearer['tenant_id'] ?: $tenantId;
            $tenantSlug = $bearer['tenant_slug'] ?: $tenantSlug;
        }

        if (in_array($guard, ApiGuardMaps::TENANT_GUARDS, true) && ($tenantId || $tenantSlug)) {
            $tenant = $this->centerContext->resolve($tenantId, is_string($tenantSlug) ? $tenantSlug : null);
            if ($tenant) {
                $this->centerContext->initialize($tenant);
            }
        }

        if (! Auth::guard($guard)->check()) {
            if ($bearer) {
                Auth::guard($guard)->loginUsingId($bearer['user_id']);
            }
        }

        if (! Auth::guard($guard)->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = Auth::guard($guard)->user();

        $tenantName = $tenant
            ? optional($tenant)->name
            : null;

        $acl = ['roles' => [], 'permissions' => []];
        if ($guard === 'web' && $user) {
            $acl = app(UserAclService::class)->forUserId((int) $user->id);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name ?? $user->parent_name ?? 'User',
                'email' => $user->email,
                'role' => ApiGuardMaps::ROLE_MAP[$guard] ?? 'admin',
                'locale' => app()->getLocale(),
                'created_at' => optional($user->created_at)->toDateString() ?? now()->toDateString(),
                'tenant_id' => $tenant?->id,
                'tenant_slug' => $tenantSlug,
                'tenant_name' => $tenantName,
                'roles' => $acl['roles'],
                'permissions' => $acl['permissions'],
            ],
        ]);
    }
}
