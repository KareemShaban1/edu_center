<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class UserAclService
{
    /**
     * @return array{roles: list<string>, permissions: list<string>}
     */
    public function forUserId(int $userId): array
    {
        $empty = ['roles' => [], 'permissions' => []];
        if ($userId < 1 || ! Schema::connection('center')->hasTable('roles')) {
            return $empty;
        }

        $db = DB::connection('center');
        $roles = collect();
        $roleIds = collect();

        if (Schema::connection('center')->hasTable('model_has_roles')) {
            $rows = $db->query()
                ->from('model_has_roles')
                ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->where('model_has_roles.model_id', $userId)
                ->where('model_has_roles.model_type', 'like', '%User%')
                ->get(['roles.id', 'roles.name']);

            $roles = $rows->pluck('name')->map(fn ($name) => (string) $name)->unique()->values();
            $roleIds = $rows->pluck('id')->map(fn ($id) => (int) $id)->unique()->values();
        }

        $permissions = collect();

        if (
            $roleIds->isNotEmpty()
            && Schema::connection('center')->hasTable('role_has_permissions')
            && Schema::connection('center')->hasTable('permissions')
        ) {
            $permissions = $permissions->merge(
                $db->query()
                    ->from('role_has_permissions')
                    ->join('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                    ->whereIn('role_has_permissions.role_id', $roleIds->all())
                    ->pluck('permissions.name')
            );
        }

        if (Schema::connection('center')->hasTable('model_has_permissions') && Schema::connection('center')->hasTable('permissions')) {
            $permissions = $permissions->merge(
                $db->query()
                    ->from('model_has_permissions')
                    ->join('permissions', 'model_has_permissions.permission_id', '=', 'permissions.id')
                    ->where('model_has_permissions.model_id', $userId)
                    ->where('model_has_permissions.model_type', 'like', '%User%')
                    ->pluck('permissions.name')
            );
        }

        return [
            'roles' => $roles->all(),
            'permissions' => $permissions
                ->map(fn ($name) => (string) $name)
                ->unique()
                ->values()
                ->all(),
        ];
    }
}
