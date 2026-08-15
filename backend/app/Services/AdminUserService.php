<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

final class AdminUserService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(): Collection
    {
        $tenantDb = DB::connection('center');
        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        $hasRoles = Schema::connection('center')->hasTable('roles')
            && Schema::connection('center')->hasTable('model_has_roles');

        $query = $tenantDb->table('users')->select('users.id', 'users.name', 'users.email', 'users.created_at');
        if ($hasPhone) {
            $query->addSelect('users.phone');
        }
        if ($hasIsActive) {
            $query->addSelect('users.is_active');
        }
        if ($hasRoles) {
            $query
                ->leftJoin('model_has_roles', function ($join): void {
                    $join->on('users.id', '=', 'model_has_roles.model_id')
                        ->where('model_has_roles.model_type', 'like', '%User');
                })
                ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->addSelect(DB::raw('MIN(roles.name) as role'))
                ->groupBy('users.id', 'users.name', 'users.email', 'users.created_at');
            if ($hasPhone) {
                $query->groupBy('users.phone');
            }
            if ($hasIsActive) {
                $query->groupBy('users.is_active');
            }
        }

        return $query->orderBy('users.id', 'desc')->get()->map(function ($row) use ($hasPhone, $hasIsActive) {
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
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{id: int}|array{message: string, status: int}
     */
    public function store(array $payload): array
    {
        $tenantDb = DB::connection('center');
        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');

        if ($tenantDb->table('users')->where('email', $payload['email'])->exists()) {
            return ['message' => 'Email already exists', 'status' => 422];
        }

        $insert = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasPhone) {
            $insert['phone'] = $payload['phone'] ?? null;
        }
        if ($hasIsActive) {
            $insert['is_active'] = ($payload['status'] ?? 'active') === 'active' ? 1 : 0;
        }
        $userId = (int) $tenantDb->table('users')->insertGetId($insert);

        if (
            ! empty($payload['role'])
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

        return ['id' => $userId];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array{message: string}|array{message: string, status: int}
     */
    public function update(int $id, array $payload): array
    {
        $tenantDb = DB::connection('center');
        $user = $tenantDb->table('users')->where('id', $id)->first();
        if (! $user) {
            return ['message' => 'User not found', 'status' => 404];
        }
        if ($tenantDb->table('users')->where('email', $payload['email'])->where('id', '!=', $id)->exists()) {
            return ['message' => 'Email already exists', 'status' => 422];
        }

        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'updated_at' => now(),
        ];
        if (! empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }
        if ($hasPhone) {
            $update['phone'] = $payload['phone'] ?? null;
        }
        if ($hasIsActive) {
            $update['is_active'] = ($payload['status'] ?? 'active') === 'active' ? 1 : 0;
        }
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
            if (! empty($payload['role'])) {
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

        return ['message' => 'User updated'];
    }

    /**
     * @return array{message: string}|array{message: string, status: int}
     */
    public function destroy(int $id, int $currentUserId): array
    {
        if ($currentUserId === $id) {
            return ['message' => 'You cannot delete your own account', 'status' => 422];
        }

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

        return ['message' => 'User deleted'];
    }
}
