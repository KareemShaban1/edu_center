<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Centers\CenterContext;
use App\Centers\CenterMembershipService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait CenterSeederSupport
{
    protected function centerId(): ?int
    {
        return CenterContext::id();
    }

    protected function centerSlug(): string
    {
        return (string) (CenterContext::center()?->slug ?? 'center');
    }

    protected function scopedDelete(string $table): void
    {
        $centerId = $this->centerId();

        if ($centerId && Schema::connection('mysql')->hasColumn($table, 'center_id')) {
            DB::connection('mysql')->table($table)->where('center_id', $centerId)->delete();

            return;
        }

        DB::connection('mysql')->table($table)->delete();
    }

    protected function parentPhone(int $index): string
    {
        $prefix = $this->centerSlug() === 'test' ? '011' : '010';

        return $prefix.str_pad((string) $index, 8, '0', STR_PAD_LEFT);
    }

    protected function studentCode(int $index): string
    {
        $prefix = strtoupper(substr($this->centerSlug(), 0, 4));

        return $prefix.'-'.str_pad((string) $index, 6, '0', STR_PAD_LEFT);
    }

    protected function registerParentMembership(int $parentId): void
    {
        $center = CenterContext::center();
        if ($center) {
            app(CenterMembershipService::class)->registerParentProfile($parentId);
        }
    }

    protected function registerStudentMembership(int $studentId): void
    {
        $center = CenterContext::center();
        if ($center) {
            app(CenterMembershipService::class)->registerStudentProfile($studentId);
        }
    }

    /** @param  array<string, mixed>  $row */
    protected function insertScopedRow(string $table, array $row): void
    {
        if ($this->centerId() && Schema::connection('mysql')->hasColumn($table, 'center_id')) {
            $row['center_id'] = $this->centerId();
        }

        $row['created_at'] = $row['created_at'] ?? now();
        $row['updated_at'] = $row['updated_at'] ?? now();

        DB::connection('mysql')->table($table)->insert($row);
    }

    protected function defaultEmail(string $role): string
    {
        $slug = $this->centerSlug();

        if ($slug === 'demo') {
            return "{$role}@educenter.com";
        }

        return "{$role}-{$slug}@educenter.com";
    }

    protected function roleEmail(string $role, int $index = 1): string
    {
        if ($index <= 1) {
            return $this->defaultEmail($role);
        }

        $slug = $this->centerSlug();
        $suffix = $index;

        if ($slug === 'demo') {
            return "{$role}{$suffix}@educenter.com";
        }

        return "{$role}{$suffix}-{$slug}@educenter.com";
    }
}
