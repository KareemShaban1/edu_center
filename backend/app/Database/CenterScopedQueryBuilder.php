<?php

declare(strict_types=1);

namespace App\Database;

use App\Centers\CenterContext;
use App\Centers\CenterScopedTables;
use Illuminate\Database\Query\Builder;

class CenterScopedQueryBuilder extends Builder
{
    public function insert(array $values)
    {
        if (CenterContext::hasCenter()) {
            $values = $this->mergeCenterId($values);
        }

        return parent::insert($values);
    }

    public function insertGetId(array $values, $sequence = null)
    {
        if (CenterContext::hasCenter()) {
            $values = $this->mergeCenterId($values);
        }

        return parent::insertGetId($values, $sequence);
    }

    public function insertOrIgnore(array $values)
    {
        if (CenterContext::hasCenter()) {
            $values = $this->mergeCenterId($values);
        }

        return parent::insertOrIgnore($values);
    }

    public function updateOrInsert(array $attributes, array $values = [])
    {
        if (CenterContext::hasCenter()) {
            $attributes = $this->mergeCenterId($attributes, false);
            $values = $this->mergeCenterId($values, false);
        }

        return parent::updateOrInsert($attributes, $values);
    }

    protected function mergeCenterId(array $values, bool $allowBatch = true): array
    {
        if (! $this->from) {
            return $values;
        }

        $table = CenterScopedTables::normalize($this->from);
        if (CenterScopedTables::isMembershipScoped($table)) {
            return $values;
        }

        if (! CenterScopedTables::isScoped($table)) {
            return $values;
        }

        $centerId = CenterContext::id();
        if (! $centerId) {
            return $values;
        }

        $column = $this->centerColumnName();

        if ($allowBatch && array_is_list($values) && isset($values[0]) && is_array($values[0])) {
            return array_map(function (array $row) use ($centerId, $column) {
                if (! array_key_exists($column, $row)) {
                    $row[$column] = $centerId;
                }

                return $row;
            }, $values);
        }

        if (! array_key_exists($column, $values)) {
            $values[$column] = $centerId;
        }

        return $values;
    }

    protected function centerColumnName(): string
    {
        if (! $this->from) {
            return 'center_id';
        }

        $columns = $this->getConnection()->getSchemaBuilder()->getColumnListing(
            CenterScopedTables::normalize($this->from)
        );

        return in_array('center_id', $columns, true) ? 'center_id' : 'tenant_id';
    }
}
