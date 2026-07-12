<?php

declare(strict_types=1);

namespace App\Http\Support;

final class ApiGuardMaps
{
    /** @var array<string, string> */
    public const GUARD_MAP = [
        'users' => 'web',
        'teacher' => 'teacher',
        'parent' => 'parent',
        'student' => 'student',
        'super_admin' => 'platform_admin',
        'platform_admin' => 'platform_admin',
        'admin' => 'web',
    ];

    /** @var array<string, string> */
    public const ROLE_MAP = [
        'web' => 'admin',
        'teacher' => 'teacher',
        'parent' => 'parent',
        'student' => 'student',
        'platform_admin' => 'super_admin',
    ];

    /** @var array<int, string> */
    public const TENANT_GUARDS = ['web', 'teacher', 'parent', 'student'];
}
