<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Centers\CenterContextManager;
use App\Models\Platform\Center;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

trait ResolvesCenterApiContext
{
    protected function centerContext(): CenterContextManager
    {
        return app(CenterContextManager::class);
    }

    protected function resolveCenterBySlug(?string $slug): ?Center
    {
        return $this->centerContext()->resolveBySlug($slug);
    }

    /** @deprecated Use resolveCenterBySlug() */
    protected function resolveTenantBySlug(?string $slug, ?string $unused = null): ?Center
    {
        return $this->resolveCenterBySlug($slug);
    }

    protected function ensureCenterInitialized(?Center $center): void
    {
        $this->centerContext()->initialize($center);
    }

    /** @deprecated Use ensureCenterInitialized() */
    protected function ensureTenantInitialized(?Center $center): void
    {
        $this->ensureCenterInitialized($center);
    }

    protected function endCenterContext(): void
    {
        $this->centerContext()->end();
    }

    /** @deprecated Use endCenterContext() */
    protected function endTenantContext(): void
    {
        $this->endCenterContext();
    }

    /**
     * @return array{guard: string, role: string, center: Center|null, centerDb: \Illuminate\Database\Connection, authUser: mixed, error: JsonResponse|null, tenant: Center|null, tenantDb: \Illuminate\Database\Connection}
     */
    protected function resolveDashboardContext(Request $request, array $centerGuards, array $roleMap): array
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        $role = $roleMap[$guard] ?? 'admin';
        $centerContext = $this->centerContext();
        $center = null;

        if (in_array($guard, $centerGuards, true)) {
            $center = $centerContext->resolveFromRequest($request);
            if (! $center) {
                return ['error' => response()->json(['message' => 'Center not found'], 422)];
            }
            $centerContext->initialize($center);
        }

        if (! Auth::guard($guard)->check()) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401)];
        }

        if ($role !== 'super_admin' && ! in_array($guard, $centerGuards, true)) {
            return ['error' => response()->json(['message' => 'Forbidden'], 403)];
        }

        $db = DB::connection('center');

        return [
            'error' => null,
            'guard' => $guard,
            'role' => $role,
            'center' => $center,
            'centerDb' => $db,
            'tenant' => $center,
            'tenantDb' => $db,
            'authUser' => Auth::guard($guard)->user(),
        ];
    }
}
