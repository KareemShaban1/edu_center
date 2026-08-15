<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContext;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class AdminRoleService
{
    /**
     * @return array{roles: Collection<int, array<string, mixed>>, permissions: Collection<int, string>}|array{message: string, status: int}
     */
    public function list(): array
    {
        if (! Schema::connection('center')->hasTable('roles')) {
            return ['roles' => collect(), 'permissions' => collect()];
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

        return ['roles' => $roles, 'permissions' => $allPermissions];
    }

    /**
     * @return array{message: string, status: int}|array{id: int}
     */
    public function ensureRolesTable(): ?array
    {
        if (! Schema::connection('center')->hasTable('roles')) {
            return ['message' => 'Roles table not found', 'status' => 422];
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{id: int}|array{message: string, status: int}
     */
    public function store(array $payload): array
    {
        $tableError = $this->ensureRolesTable();
        if ($tableError !== null) {
            return $tableError;
        }

        $tenantDb = DB::connection('center');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');
        $guardName = $payload['guard_name'] ?? 'web';
        if ($tenantDb->table('roles')->where('name', $payload['name'])->where('guard_name', $guardName)->exists()) {
            return ['message' => 'Role already exists', 'status' => 422];
        }

        $insert = [
            'name' => $payload['name'],
            'guard_name' => $guardName,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasRoleDescription) {
            $insert['description'] = $payload['description'] ?? null;
        }
        $roleId = (int) $tenantDb->table('roles')->insertGetId($insert);

        $this->syncRolePermissions($tenantDb, $roleId, $payload['permissions'] ?? []);

        return ['id' => $roleId];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{message: string}|array{message: string, status: int}
     */
    public function update(int $id, array $payload): array
    {
        $tableError = $this->ensureRolesTable();
        if ($tableError !== null) {
            return $tableError;
        }

        $tenantDb = DB::connection('center');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');
        $role = $tenantDb->table('roles')->where('id', $id)->first();
        if (! $role) {
            return ['message' => 'Role not found', 'status' => 404];
        }
        $guardName = $payload['guard_name'] ?? $role->guard_name ?? 'web';
        if ($tenantDb->table('roles')->where('name', $payload['name'])->where('guard_name', $guardName)->where('id', '!=', $id)->exists()) {
            return ['message' => 'Role already exists', 'status' => 422];
        }

        $update = [
            'name' => $payload['name'],
            'guard_name' => $guardName,
            'updated_at' => now(),
        ];
        if ($hasRoleDescription) {
            $update['description'] = $payload['description'] ?? null;
        }
        $tenantDb->table('roles')->where('id', $id)->update($update);

        $this->syncRolePermissions($tenantDb, $id, $payload['permissions'] ?? []);

        return ['message' => 'Role updated'];
    }

    /**
     * @return array{message: string}|array{message: string, status: int}
     */
    public function destroy(int $id): array
    {
        $tableError = $this->ensureRolesTable();
        if ($tableError !== null) {
            return $tableError;
        }

        $tenantDb = DB::connection('center');
        if (Schema::connection('center')->hasTable('model_has_roles')) {
            $tenantDb->table('model_has_roles')->where('role_id', $id)->delete();
        }
        if (Schema::connection('center')->hasTable('role_has_permissions')) {
            $tenantDb->query()->from('role_has_permissions')->where('role_id', $id)->delete();
        }
        $tenantDb->table('roles')->where('id', $id)->delete();

        return ['message' => 'Role deleted'];
    }

    /**
     * @param  list<string>|mixed  $permissionNames
     */
    private function syncRolePermissions($tenantDb, int $roleId, mixed $permissionNames): void
    {
        if (! Schema::connection('center')->hasTable('role_has_permissions')) {
            return;
        }

        $tenantDb->query()->from('role_has_permissions')->where('role_id', $roleId)->delete();

        $names = collect(is_array($permissionNames) ? $permissionNames : [])
            ->filter(fn ($name) => is_string($name) && $name !== '')
            ->unique()
            ->values()
            ->all();

        if ($names === [] || ! Schema::connection('center')->hasTable('permissions')) {
            return;
        }

        $permIds = $tenantDb->table('permissions')
            ->whereIn('name', $names)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($permIds->isEmpty()) {
            return;
        }

        $hasCenterCol = Schema::connection('center')->hasColumn('role_has_permissions', 'center_id');
        $centerId = CenterContext::id();

        $rows = $permIds->map(function (int $permId) use ($roleId, $hasCenterCol, $centerId) {
            $row = [
                'permission_id' => $permId,
                'role_id' => $roleId,
            ];
            if ($hasCenterCol && $centerId) {
                $row['center_id'] = $centerId;
            }

            return $row;
        })->all();

        $tenantDb->table('role_has_permissions')->insert($rows);
    }
}
