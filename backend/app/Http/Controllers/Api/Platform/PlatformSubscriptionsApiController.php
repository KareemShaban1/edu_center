<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Platform;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesPlatformApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class PlatformSubscriptionsApiController extends Controller
{
    use ResolvesPlatformApiContext;
    public function index(Request $request): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $rows = DB::connection($conn)->table('tenant_infos as ti')
            ->leftJoin('tenants as t', 'ti.tenant_id', '=', 't.id')
            ->select('ti.id as info_id', 'ti.name', 't.data as tenant_data')
            ->orderByDesc('ti.id')
            ->get();
        $subscriptions = $rows->map(function ($row) {
            $data = [];
            if (!empty($row->tenant_data)) {
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
        return response()->json($subscriptions);
    }

    public function store(Request $request): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $payload = $request->validate([
            'tenant_id' => ['nullable', 'integer'],
            'tenant_name' => ['nullable', 'string', 'max:255'],
            'plan' => ['required', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],
            'status' => ['nullable', 'in:active,trial,past_due,cancelled'],
            'next_billing_date' => ['nullable', 'date'],
        ]);
        $info = null;
        if (!empty($payload['tenant_id'])) {
            $info = DB::connection($conn)->table('tenant_infos')->where('id', (int) $payload['tenant_id'])->first();
        }
        if (!$info && !empty($payload['tenant_name'])) {
            $info = DB::connection($conn)->table('tenant_infos')->where('name', $payload['tenant_name'])->first();
        }
        if (!$info) return response()->json(['message' => 'Tenant not found'], 404);
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && !empty($tenantRow->data)) {
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
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $info = DB::connection($conn)->table('tenant_infos')->where('id', $id)->first();
        if (!$info) return response()->json(['message' => 'Subscription not found'], 404);
        $payload = $request->validate([
            'plan' => ['required', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],
            'status' => ['nullable', 'in:active,trial,past_due,cancelled'],
            'next_billing_date' => ['nullable', 'date'],
        ]);
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && !empty($tenantRow->data)) {
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
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
$ctx = $this->resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $info = DB::connection($conn)->table('tenant_infos')->where('id', $id)->first();
        if (!$info) return response()->json(['message' => 'Subscription not found'], 404);
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && !empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'subscription.status', 'cancelled');
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    }

}
