<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Models\Unit;

final class UnitRepository
{
    public function find(int $id): ?Unit
    {
        return Unit::query()
            ->with('media')
            ->find($id);
    }
}
