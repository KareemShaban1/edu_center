<?php

declare(strict_types=1);

namespace App\Centers;

final class CenterScopedTables
{
    public static function isScoped(string $table): bool
    {
        $name = self::normalize($table);

        return in_array($name, config('centers.scoped_tables', []), true)
            || self::isMembershipScoped($name);
    }

    public static function isMembershipScoped(string $table): bool
    {
        return self::membershipRole($table) !== null;
    }

    public static function membershipUserType(string $table): ?string
    {
        $name = self::normalize($table);
        $map = config('centers.membership_scoped_tables', []);

        return $map[$name] ?? null;
    }

    /** @deprecated Use membershipUserType() */
    public static function membershipRole(string $table): ?string
    {
        $userType = self::membershipUserType($table);

        if (! $userType) {
            return null;
        }

        return $userType === \App\Models\Student::class ? 'student' : 'parent';
    }

    public static function normalize(string $table): string
    {
        $table = trim($table);

        if (str_contains($table, ' as ')) {
            $table = trim(explode(' as ', $table, 2)[0]);
        }

        if (str_contains($table, ' ')) {
            $table = trim(explode(' ', $table, 2)[0]);
        }

        return str_replace('`', '', $table);
    }
}
