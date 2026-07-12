<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminRolesApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function index(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['roles' => [], 'permissions' => []]);
        }

        $tenantDb = DB::connection('center');
        $hasRolePerms = Schema::connection('center')->hasTable('role_has_permissions');
        $hasPerms = Schema::connection('center')->hasTable('permissions');
        $hasModelRoles = Schema::connection('center')->hasTable('model_has_roles');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');

        $roleSelect = ['id', 'name', 'guard_name'];
        if ($hasRoleDescription) {
            $roleSelect[] = 'description';
        }

        $roles = $tenantDb->table('roles')
            ->select($roleSelect)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($r) use ($tenantDb, $hasRolePerms, $hasPerms, $hasModelRoles) {
                $perms = collect();
                if ($hasRolePerms && $hasPerms) {
                    $perms = $tenantDb->table('role_has_permissions')
                        ->join('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                        ->where('role_has_permissions.role_id', $r->id)
                        ->pluck('permissions.name');
                }
                $usersCount = 0;
                if ($hasModelRoles) {
                    $usersCount = (int) $tenantDb->table('model_has_roles')
                        ->where('role_id', $r->id)
                        ->where('model_type', 'like', '%User')
                        ->distinct('model_id')
                        ->count('model_id');
                }
                return [
                    'id' => (int) $r->id,
                    'name' => $r->name,
                    'guard_name' => $r->guard_name,
                    'description' => $r->description ?? '',
                    'permissions' => $perms->values(),
                    'users_count' => $usersCount,
                ];
            })
            ->values();

        $allPermissions = collect();
        if ($hasPerms) {
            $allPermissions = $tenantDb->table('permissions')->orderBy('name')->pluck('name')->values();
        }

        return response()->json(['roles' => $roles, 'permissions' => $allPermissions]);
    }

    public function store(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['message' => 'Roles table not found'], 422);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'guard_name' => ['nullable', 'string', 'max:50'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:150'],
        ]);

        $tenantDb = DB::connection('center');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');
        $guardName = $payload['guard_name'] ?? 'web';
        if ($tenantDb->table('roles')->where('name', $payload['name'])->where('guard_name', $guardName)->exists()) {
            return response()->json(['message' => 'Role already exists'], 422);
        }

        $insert = [
            'name' => $payload['name'],
            'guard_name' => $guardName,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasRoleDescription) $insert['description'] = $payload['description'] ?? null;
        $roleId = $tenantDb->table('roles')->insertGetId($insert);

        if (
            !empty($payload['permissions'])
            && Schema::connection('center')->hasTable('permissions')
            && Schema::connection('center')->hasTable('role_has_permissions')
        ) {
            $permIds = $tenantDb->table('permissions')->whereIn('name', $payload['permissions'])->pluck('id');
            foreach ($permIds as $permId) {
                $tenantDb->table('role_has_permissions')->insert([
                    'permission_id' => $permId,
                    'role_id' => $roleId,
                ]);
            }
        }

        return response()->json(['id' => (int) $roleId], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['message' => 'Roles table not found'], 422);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'guard_name' => ['nullable', 'string', 'max:50'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:150'],
        ]);

        $tenantDb = DB::connection('center');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');
        $role = $tenantDb->table('roles')->where('id', $id)->first();
        if (!$role) return response()->json(['message' => 'Role not found'], 404);
        $guardName = $payload['guard_name'] ?? $role->guard_name ?? 'web';
        if ($tenantDb->table('roles')->where('name', $payload['name'])->where('guard_name', $guardName)->where('id', '!=', $id)->exists()) {
            return response()->json(['message' => 'Role already exists'], 422);
        }

        $update = [
            'name' => $payload['name'],
            'guard_name' => $guardName,
            'updated_at' => now(),
        ];
        if ($hasRoleDescription) $update['description'] = $payload['description'] ?? null;
        $tenantDb->table('roles')->where('id', $id)->update($update);

        if (Schema::connection('center')->hasTable('role_has_permissions')) {
            $tenantDb->table('role_has_permissions')->where('role_id', $id)->delete();
            if (!empty($payload['permissions']) && Schema::connection('center')->hasTable('permissions')) {
                $permIds = $tenantDb->table('permissions')->whereIn('name', $payload['permissions'])->pluck('id');
                foreach ($permIds as $permId) {
                    $tenantDb->table('role_has_permissions')->insert([
                        'permission_id' => $permId,
                        'role_id' => $id,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Role updated']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);
        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['message' => 'Roles table not found'], 422);
        }

        $tenantDb = DB::connection('center');
        if (Schema::connection('center')->hasTable('model_has_roles')) {
            $tenantDb->table('model_has_roles')->where('role_id', $id)->delete();
        }
        if (Schema::connection('center')->hasTable('role_has_permissions')) {
            $tenantDb->table('role_has_permissions')->where('role_id', $id)->delete();
        }
        $tenantDb->table('roles')->where('id', $id)->delete();
        return response()->json(['message' => 'Role deleted']);
    }

}
