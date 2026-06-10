<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Models\Platform\Tenant;
use App\Models\Platform\TenantInfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

trait ResolvesTenantApiContext
{
    protected function centralConnection(): string
    {
        return config('tenancy.database.central_connection', config('database.default', 'mysql'));
    }

    protected function resolveTenantBySlug(?string $tenantSlug, ?string $centralConnection = null): ?Tenant
    {
        if (! $tenantSlug) {
            return null;
        }

        $connection = $centralConnection ?? $this->centralConnection();
        $tenantInfo = TenantInfo::on($connection)->where('subdomain', $tenantSlug)->first();
        if (! $tenantInfo) {
            return null;
        }

        return Tenant::on($connection)->find($tenantInfo->tenant_id);
    }

    protected function ensureTenantInitialized(?Tenant $tenant): void
    {
        if (! $tenant) {
            return;
        }

        tenancy()->initialize($tenant);
        $dbName = data_get($tenant->toArray(), 'tenancy_db_name');
        if ($dbName) {
            Config::set('database.connections.tenant.database', $dbName);
            DB::purge('tenant');
            DB::reconnect('tenant');
        }
    }

    /**
     * @return array{guard: string, role: string, tenant: Tenant|null, tenantDb: \Illuminate\Database\Connection, authUser: mixed, error: JsonResponse|null}
     */
    protected function resolveDashboardContext(Request $request, array $tenantGuards, array $roleMap): array
    {
        $guard = $request->session()->get('api_auth_guard', 'web');
        $role = $roleMap[$guard] ?? 'admin';
        $centralConnection = $this->centralConnection();
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = null;

        if (in_array($guard, $tenantGuards, true)) {
            $tenant = $tenantId
                ? Tenant::on($centralConnection)->find($tenantId)
                : $this->resolveTenantBySlug($tenantSlug, $centralConnection);
            if (! $tenant) {
                return ['error' => response()->json(['message' => 'Tenant not found'], 422)];
            }
            $this->ensureTenantInitialized($tenant);
        }

        if (! Auth::guard($guard)->check()) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401)];
        }

        if ($role !== 'super_admin' && ! in_array($guard, $tenantGuards, true)) {
            return ['error' => response()->json(['message' => 'Forbidden'], 403)];
        }

        return [
            'error' => null,
            'guard' => $guard,
            'role' => $role,
            'tenant' => $tenant,
            'tenantDb' => DB::connection('tenant'),
            'authUser' => Auth::guard($guard)->user(),
        ];
    }
}
