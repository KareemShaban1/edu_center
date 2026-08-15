<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Models\Parents;
use App\Models\Platform\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait ResolvesParentApiContext
{
    use ResolvesCenterApiContext;

    /**
     * @return array{error: JsonResponse|null, tenant: Center|null, tenantDb: \Illuminate\Database\Connection, parentId: int|null}
     */
    protected function resolveParentContext(Request $request): array
    {
        $guard = $request->session()->get('api_auth_guard', 'parent');
        if ($guard !== 'parent') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403), 'tenant' => null, 'tenantDb' => DB::connection('center'), 'parentId' => null];
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (! $tenant) {
            return ['error' => response()->json(['message' => 'Tenant not found'], 422), 'tenant' => null, 'tenantDb' => DB::connection('center'), 'parentId' => null];
        }

        $this->ensureTenantInitialized($tenant);

        $parentId = Auth::guard('parent')->id() ?? $request->session()->get('api_auth_user_id');
        if (! $parentId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401), 'tenant' => null, 'tenantDb' => DB::connection('center'), 'parentId' => null];
        }

        return [
            'error' => null,
            'tenant' => $tenant,
            'tenantDb' => DB::connection('center'),
            'parentId' => (int) $parentId,
        ];
    }

    /**
     * @return array{error: JsonResponse|null, email: string|null, userType: string|null}
     */
    protected function resolveParentPortalContext(Request $request): array
    {
        if ($request->session()->get('api_auth_guard') !== 'parent') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403), 'email' => null, 'userType' => null];
        }

        $email = $request->session()->get('api_profile_email');
        $userType = $request->session()->get('api_profile_user_type', Parents::class);
        if (! $email) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401), 'email' => null, 'userType' => null];
        }

        return ['error' => null, 'email' => (string) $email, 'userType' => (string) $userType];
    }
}
