<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Parent;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\ResolvesCenterApiContext;
use App\Models\Parents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ParentBootstrapApiController extends Controller
{
    use ResolvesCenterApiContext;
    public function show(Request $request): JsonResponse
    {
$bearer = ApiBearerAuth::resolve($request);
        $portalMode = $request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false);
        if ($portalMode) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type', Parents::class) ?: ($bearer['user_type'] ?? Parents::class);
            if ($email) {
                return response()->json(app(MultiCenterPortalService::class)->parentPortal($email, $userType));
            }
        }
        $guard = $request->session()->get('api_auth_guard', 'parent');
        if ($guard !== 'parent') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $this->ensureTenantInitialized($tenant);

        $authParentId = Auth::guard('parent')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authParentId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(app(MultiCenterPortalService::class)->parentBootstrap((int) $authParentId));
    }

}
