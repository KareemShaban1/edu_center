<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use App\Centers\CenterContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToCenter
{
    public static function bootBelongsToCenter(): void
    {
        static::addGlobalScope('center', function (Builder $builder) {
            if (! CenterContext::hasCenter()) {
                return;
            }

            $table = $builder->getModel()->getTable();
            $column = self::centerColumnForTable($table);
            $builder->where("{$table}.{$column}", CenterContext::id());
        });

        static::creating(function (Model $model) {
            if (! CenterContext::hasCenter()) {
                return;
            }

            $column = self::centerColumnForModel($model);
            if (! $model->getAttribute($column)) {
                $model->setAttribute($column, CenterContext::id());
            }
        });
    }

    protected static function centerColumnForTable(string $table): string
    {
        $model = new static();
        if ($model->getConnection()->getSchemaBuilder()->hasColumn($table, 'center_id')) {
            return 'center_id';
        }

        return 'tenant_id';
    }

    protected static function centerColumnForModel(Model $model): string
    {
        return self::centerColumnForTable($model->getTable());
    }
}
