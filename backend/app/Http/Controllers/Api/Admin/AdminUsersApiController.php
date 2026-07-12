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

class AdminUsersApiController extends Controller
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

        $tenantDb = DB::connection('center');
        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        $hasRoles = Schema::connection('center')->hasTable('roles') && Schema::connection('center')->hasTable('model_has_roles');

        $query = $tenantDb->table('users')->select('users.id', 'users.name', 'users.email', 'users.created_at');
        if ($hasPhone) $query->addSelect('users.phone');
        if ($hasIsActive) $query->addSelect('users.is_active');
        if ($hasRoles) {
            $query
                ->leftJoin('model_has_roles', function ($join) {
                    $join->on('users.id', '=', 'model_has_roles.model_id')
                        ->where('model_has_roles.model_type', 'like', '%User');
                })
                ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->addSelect(DB::raw('MIN(roles.name) as role'))
                ->groupBy('users.id', 'users.name', 'users.email', 'users.created_at');
            if ($hasPhone) $query->groupBy('users.phone');
            if ($hasIsActive) $query->groupBy('users.is_active');
        }

        $users = $query->orderBy('users.id', 'desc')->get()->map(function ($row) use ($hasPhone, $hasIsActive) {
            return [
                'id' => (int) $row->id,
                'name' => $row->name,
                'phone' => $hasPhone ? ($row->phone ?? '-') : '-',
                'email' => $row->email,
                'role' => $row->role ?? 'admin',
                'status' => $hasIsActive ? ((int) ($row->is_active ?? 1) === 1 ? 'active' : 'inactive') : 'active',
                'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
            ];
        })->values();

        return response()->json(['users' => $users]);
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

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'max:128'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $tenantDb = DB::connection('center');
        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        if ($tenantDb->table('users')->where('email', $payload['email'])->exists()) {
            return response()->json(['message' => 'Email already exists'], 422);
        }

        $insert = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasPhone) $insert['phone'] = $payload['phone'] ?? null;
        if ($hasIsActive) $insert['is_active'] = ($payload['status'] ?? 'active') === 'active' ? 1 : 0;
        $userId = $tenantDb->table('users')->insertGetId($insert);

        if (
            !empty($payload['role'])
            && Schema::connection('center')->hasTable('roles')
            && Schema::connection('center')->hasTable('model_has_roles')
        ) {
            $role = $tenantDb->table('roles')->where('name', $payload['role'])->first();
            if ($role) {
                $tenantDb->table('model_has_roles')->insert([
                    'role_id' => $role->id,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $userId,
                ]);
            }
        }

        return response()->json(['id' => (int) $userId], 201);
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

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:6', 'max:128'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $tenantDb = DB::connection('center');
        $user = $tenantDb->table('users')->where('id', $id)->first();
        if (!$user) return response()->json(['message' => 'User not found'], 404);
        if ($tenantDb->table('users')->where('email', $payload['email'])->where('id', '!=', $id)->exists()) {
            return response()->json(['message' => 'Email already exists'], 422);
        }

        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'updated_at' => now(),
        ];
        if (!empty($payload['password'])) $update['password'] = Hash::make($payload['password']);
        if ($hasPhone) $update['phone'] = $payload['phone'] ?? null;
        if ($hasIsActive) $update['is_active'] = ($payload['status'] ?? 'active') === 'active' ? 1 : 0;
        $tenantDb->table('users')->where('id', $id)->update($update);

        if (
            Schema::connection('center')->hasTable('roles')
            && Schema::connection('center')->hasTable('model_has_roles')
        ) {
            $modelType = $tenantDb->table('model_has_roles')
                ->where('model_id', $id)
                ->where('model_type', 'like', '%User')
                ->value('model_type') ?? 'App\\Models\\User';
            $tenantDb->table('model_has_roles')
                ->where('model_id', $id)
                ->where('model_type', $modelType)
                ->delete();
            if (!empty($payload['role'])) {
                $role = $tenantDb->table('roles')->where('name', $payload['role'])->first();
                if ($role) {
                    $tenantDb->table('model_has_roles')->insert([
                        'role_id' => $role->id,
                        'model_type' => $modelType,
                        'model_id' => $id,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'User updated']);
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
        if ((int) Auth::guard('web')->id() === $id) return response()->json(['message' => 'You cannot delete your own account'], 422);

        $tenantDb = DB::connection('center');
        if (Schema::connection('center')->hasTable('model_has_roles')) {
            $tenantDb->table('model_has_roles')
                ->where('model_id', $id)
                ->where('model_type', 'like', '%User')
                ->delete();
        }
        if (Schema::connection('center')->hasTable('model_has_permissions')) {
            $tenantDb->table('model_has_permissions')
                ->where('model_id', $id)
                ->where('model_type', 'like', '%User')
                ->delete();
        }
        $tenantDb->table('users')->where('id', $id)->delete();
        return response()->json(['message' => 'User deleted']);
    }

}
