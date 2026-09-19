<?php

declare(strict_types=1);

namespace App\Support\Chat;

use App\Centers\CenterContext;

final class ChatScope
{
    /**
     * Run a callback without center-connection auto-scoping so portal users
     * can read their conversations across assigned centers.
     */
    public static function withoutCenter(callable $callback): mixed
    {
        $center = CenterContext::center();
        CenterContext::clear();

        try {
            return $callback();
        } finally {
            CenterContext::set($center);
        }
    }
}
