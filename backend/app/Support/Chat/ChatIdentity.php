<?php

declare(strict_types=1);

namespace App\Support\Chat;

final class ChatIdentity
{
    public function __construct(
        public readonly string $type,
        public readonly int $id,
        public readonly int $centerId,
    ) {}
}
