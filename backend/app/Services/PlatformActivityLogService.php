<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class PlatformActivityLogService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(string $conn): Collection
    {
        $tenantLogs = DB::connection($conn)->table('tenant_infos')
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get(['id', 'tenant_id', 'name', 'status', 'updated_at'])
            ->map(function ($row) {
                $status = ((int) $row->status) === 1 ? 'active' : (((int) $row->status) === 2 ? 'suspended' : 'inactive');

                return [
                    'id' => (int) $row->id,
                    'description' => 'Tenant '.$row->name.' is '.$status,
                    'causer_id' => null,
                    'created_at' => optional($row->updated_at)->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
                ];
            });

        $adminLogs = Schema::connection($conn)->hasTable('admins')
            ? DB::connection($conn)->table('admins')
                ->orderByDesc('updated_at')
                ->limit(100)
                ->get(['id', 'name', 'updated_at'])
                ->map(function ($row) {
                    return [
                        'id' => 100000 + (int) $row->id,
                        'description' => 'Platform user updated: '.$row->name,
                        'causer_id' => (int) $row->id,
                        'created_at' => optional($row->updated_at)->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
                    ];
                })
            : collect();

        return $tenantLogs->merge($adminLogs)->sortByDesc('created_at')->take(200)->values();
    }
}
