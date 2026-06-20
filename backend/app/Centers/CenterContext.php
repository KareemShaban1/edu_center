<?php

declare(strict_types=1);

namespace App\Centers;

use App\Models\Platform\Center;

final class CenterContext
{
    private static ?Center $center = null;

    private static ?int $centerId = null;

    public static function set(?Center $center): void
    {
        self::$center = $center;
        self::$centerId = $center?->id;
    }

    public static function clear(): void
    {
        self::$center = null;
        self::$centerId = null;
    }

    public static function center(): ?Center
    {
        return self::$center;
    }

    public static function id(): ?int
    {
        return self::$centerId;
    }

    public static function hasCenter(): bool
    {
        return self::$centerId !== null && self::$centerId !== '';
    }
}
