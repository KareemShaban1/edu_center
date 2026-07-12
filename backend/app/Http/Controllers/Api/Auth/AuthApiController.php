<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\ApiGuardMaps;
use App\Http\Support\AuthLoginHandler;
use App\Http\Support\AuthRegisterHandler;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AuthApiController extends Controller
{
    use ResolvesCenterApiContext;
    public function guards(Request $request): JsonResponse
    {
return response()->json([
            'guards' => ['users', 'teacher', 'parent', 'student', 'super_admin'],
        ]);
    }

    public function login(Request $request): JsonResponse
    {
return app(AuthLoginHandler::class)->login($request, ApiGuardMaps::GUARD_MAP, ApiGuardMaps::ROLE_MAP, ApiGuardMaps::TENANT_GUARDS);
    }

    public function registerParent(Request $request): JsonResponse
    {
return app(AuthRegisterHandler::class)->registerParent($request);
    }

    public function registerStudent(Request $request): JsonResponse
    {
return app(AuthRegisterHandler::class)->registerStudent($request);
    }

    public function memberships(Request $request): JsonResponse
    {
return app(AuthLoginHandler::class)->listMemberships($request, ApiGuardMaps::GUARD_MAP);
    }

    public function switchCenter(Request $request): JsonResponse
    {
return app(AuthLoginHandler::class)->switchCenter($request, ApiGuardMaps::GUARD_MAP, ApiGuardMaps::ROLE_MAP);
    }

    public function logout(Request $request): JsonResponse
    {
ApiBearerAuth::revoke($request->bearerToken());

        $guard = $request->session()->get('api_auth_guard', 'web');
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug');

        if (in_array($guard, ApiGuardMaps::TENANT_GUARDS, true)) {
            $tenant = $this->resolveCenter($tenantId, $tenantSlug);
            if ($tenant) {
                $this->ensureTenantInitialized($tenant);
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
            $tenant = $this->resolveCenter($tenantId, $tenantSlug);
            if ($tenant) {
                $this->ensureTenantInitialized($tenant);
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
            ],
        ]);
    }

}
