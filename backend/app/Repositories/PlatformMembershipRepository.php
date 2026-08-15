<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PlatformMembershipRepository
{
    /**
     * @return Collection<int, Collection<int, array{id: int, name: string, slug: string|null, status: string}>>
     */
    public function membershipsByUser(string $conn, string $userType): Collection
    {
        if (! Schema::connection($conn)->hasTable('center_memberships')
            || ! Schema::connection($conn)->hasTable('centers')) {
            return collect();
        }

        return DB::connection($conn)->table('center_memberships as cm')
            ->leftJoin('centers', 'centers.id', '=', 'cm.center_id')
            ->where('cm.user_type', $userType)
            ->orderBy('centers.name')
            ->get([
                'cm.user_id',
                'cm.status',
                'centers.id as center_id',
                'centers.name as center_name',
                'centers.slug as center_slug',
            ])
            ->groupBy('user_id')
            ->map(fn ($rows) => $rows->map(fn ($row) => [
                'id' => (int) ($row->center_id ?? 0),
                'name' => (string) ($row->center_name ?: '—'),
                'slug' => $row->center_slug,
                'status' => (string) ($row->status ?: 'assigned'),
            ])->values());
    }
}
