<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class PlatformSubscriptionService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function list(string $conn): Collection
    {
        $rows = DB::connection($conn)->table('tenant_infos as ti')
            ->leftJoin('tenants as t', 'ti.tenant_id', '=', 't.id')
            ->select('ti.id as info_id', 'ti.name', 't.data as tenant_data')
            ->orderByDesc('ti.id')
            ->get();

        return $rows->map(function ($row) {
            $data = [];
            if (! empty($row->tenant_data)) {
                $decoded = json_decode((string) $row->tenant_data, true);
                $data = is_array($decoded) ? $decoded : [];
            }
            $sub = data_get($data, 'subscription', []);

            return [
                'id' => (int) $row->info_id,
                'tenant_id' => (int) $row->info_id,
                'tenant_name' => $row->name,
                'plan' => data_get($sub, 'plan', data_get($data, 'plan', 'Starter')),
                'amount' => (float) data_get($sub, 'amount', 0),
                'billing_cycle' => data_get($sub, 'billing_cycle', 'monthly'),
                'status' => data_get($sub, 'status', 'trial'),
                'next_billing_date' => data_get($sub, 'next_billing_date', now()->addMonth()->toDateString()),
            ];
        })->values();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function store(string $conn, array $payload): bool
    {
        $info = null;
        if (! empty($payload['tenant_id'])) {
            $info = DB::connection($conn)->table('tenant_infos')->where('id', (int) $payload['tenant_id'])->first();
        }
        if (! $info && ! empty($payload['tenant_name'])) {
            $info = DB::connection($conn)->table('tenant_infos')->where('name', $payload['tenant_name'])->first();
        }
        if (! $info) {
            return false;
        }

        $this->updateTenantSubscription($conn, (int) $info->tenant_id, $payload);

        return true;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(string $conn, int $id, array $payload): bool
    {
        $info = DB::connection($conn)->table('tenant_infos')->where('id', $id)->first();
        if (! $info) {
            return false;
        }

        $this->updateTenantSubscription($conn, (int) $info->tenant_id, $payload);

        return true;
    }

    public function cancel(string $conn, int $id): bool
    {
        $info = DB::connection($conn)->table('tenant_infos')->where('id', $id)->first();
        if (! $info) {
            return false;
        }

        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && ! empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'subscription.status', 'cancelled');
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);

        return true;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function updateTenantSubscription(string $conn, int $tenantId, array $payload): void
    {
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $tenantId)->first();
        $data = [];
        if ($tenantRow && ! empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'plan', $payload['plan']);
        data_set($data, 'subscription', [
            'plan' => $payload['plan'],
            'amount' => (float) ($payload['amount'] ?? 0),
            'billing_cycle' => $payload['billing_cycle'] ?? 'monthly',
            'status' => $payload['status'] ?? 'trial',
            'next_billing_date' => $payload['next_billing_date'] ?? now()->addMonth()->toDateString(),
        ]);
        DB::connection($conn)->table('tenants')->where('id', $tenantId)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
    }
}
