<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Models\Platform\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait ResolvesTeacherApiContext
{
    use ResolvesCenterApiContext;

    /**
     * @return array{error: JsonResponse|null, tenant: Center|null, tenantDb: \Illuminate\Database\Connection, teacherId: int|null}
     */
    protected function resolveTeacherContext(Request $request): array
    {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403), 'tenant' => null, 'tenantDb' => DB::connection('center'), 'teacherId' => null];
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (! $tenant) {
            return ['error' => response()->json(['message' => 'Tenant not found'], 422), 'tenant' => null, 'tenantDb' => DB::connection('center'), 'teacherId' => null];
        }

        $this->ensureTenantInitialized($tenant);

        if (! Auth::guard('teacher')->check()) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401), 'tenant' => null, 'tenantDb' => DB::connection('center'), 'teacherId' => null];
        }

        return [
            'error' => null,
            'tenant' => $tenant,
            'tenantDb' => DB::connection('center'),
            'teacherId' => (int) Auth::guard('teacher')->id(),
        ];
    }
}
