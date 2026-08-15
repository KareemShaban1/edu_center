<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PlatformRoleService
{
    /**
     * @return array{roles: Collection<int, array<string, mixed>>, can_manage: bool}
     */
    public function list(string $conn): array
    {
        $platformAdmins = Schema::connection($conn)->hasTable('admins')
            ? (int) DB::connection($conn)->table('admins')->count()
            : 0;

        $roles = collect([
            ['id' => 1, 'name' => 'platform_admin', 'guard' => 'platform_admin', 'permissions' => 0, 'users' => $platformAdmins],
            ['id' => 2, 'name' => 'admin', 'guard' => 'web', 'permissions' => 0, 'users' => 0],
            ['id' => 3, 'name' => 'teacher', 'guard' => 'teacher', 'permissions' => 0, 'users' => 0],
            ['id' => 4, 'name' => 'student', 'guard' => 'student', 'permissions' => 0, 'users' => 0],
            ['id' => 5, 'name' => 'parent', 'guard' => 'parent', 'permissions' => 0, 'users' => 0],
        ])->values();

        return ['roles' => $roles, 'can_manage' => false];
    }
}
