<?php

declare(strict_types=1);

namespace App\Http\Support;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

final class CenterIdAssigner
{
    public static function assign(Model $model, int $centerId, bool $onlyIfMissing = false): void
    {
        $table = $model->getTable();

        if (! Schema::connection('center')->hasColumn($table, 'center_id')) {
            return;
        }

        if ($onlyIfMissing && $model->getAttribute('center_id')) {
            return;
        }

        $model->setAttribute('center_id', $centerId);
    }
}
