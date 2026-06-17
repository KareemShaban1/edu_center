<?php

declare(strict_types=1);

namespace App\Database;

use App\Centers\CenterContext;
use App\Centers\CenterScopedTables;
use Illuminate\Database\MySqlConnection;
use Illuminate\Database\Query\Builder;

class CenterScopedConnection extends MySqlConnection
{
    public function query(): Builder
    {
        return new CenterScopedQueryBuilder(
            $this,
            $this->getQueryGrammar(),
            $this->getPostProcessor()
        );
    }

    public function table($table, $as = null)
    {
        $builder = $this->query()->from($table, $as);

        return $this->applyCenterScope($builder, $table, $as);
    }

    public function applyCenterScope(Builder $builder, string $table, ?string $alias = null): Builder
    {
        if (! CenterContext::hasCenter()) {
            return $builder;
        }

        $normalized = CenterScopedTables::normalize($alias ?: $table);

        if ($membershipUserType = CenterScopedTables::membershipUserType($normalized)) {
            $idColumn = $alias ? "{$alias}.id" : "{$normalized}.id";

            return $builder->whereIn($idColumn, function ($query) use ($membershipUserType) {
                $query->from('center_memberships')
                    ->select('user_id')
                    ->where('center_id', CenterContext::id())
                    ->where('user_type', $membershipUserType)
                    ->where('status', \App\Models\Platform\CenterMembership::STATUS_ASSIGNED);
            });
        }

        if (! CenterScopedTables::isScoped($normalized)) {
            return $builder;
        }

        $column = $alias ? "{$alias}.center_id" : "{$normalized}.center_id";

        if (! $this->hasCenterIdColumn($normalized)) {
            $legacyColumn = $alias ? "{$alias}.tenant_id" : "{$normalized}.tenant_id";
            if ($this->hasLegacyTenantIdColumn($normalized)) {
                return $builder->where($legacyColumn, CenterContext::id());
            }

            return $builder;
        }

        return $builder->where($column, CenterContext::id());
    }

    protected function hasCenterIdColumn(string $table): bool
    {
        return in_array('center_id', $this->getSchemaBuilder()->getColumnListing($table), true);
    }

    protected function hasLegacyTenantIdColumn(string $table): bool
    {
        return in_array('tenant_id', $this->getSchemaBuilder()->getColumnListing($table), true);
    }
}
