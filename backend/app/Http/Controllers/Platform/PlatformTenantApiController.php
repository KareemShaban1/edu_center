<?php

declare(strict_types=1);

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\Tenant;
use App\Models\Platform\TenantInfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PlatformTenantApiController extends Controller
{
    protected function centralConnection(): string
    {
        return config('tenancy.database.central_connection', config('database.default', 'mysql'));
    }

    protected function denyUnlessPlatform(Request $request): ?JsonResponse
    {
        $guard = $request->session()->get('api_auth_guard', 'platform_admin');
        if ($guard !== 'platform_admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $authUserId = Auth::guard('platform_admin')->id() ?? $request->session()->get('api_auth_user_id');
        if (! $authUserId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return null;
    }

    protected function ensureTenantInitialized(?Tenant $tenant): void
    {
        if ($tenant) {
            tenancy()->initialize($tenant);
            $dbName = data_get($tenant->toArray(), 'tenancy_db_name');
            if ($dbName) {
                Config::set('database.connections.tenant.database', $dbName);
                DB::purge('tenant');
                DB::reconnect('tenant');
            }
        }
    }

    public function index(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }
        $conn = $this->centralConnection();
        $rows = DB::connection($conn)->table('tenant_infos as ti')
            ->leftJoin('tenants as t', 'ti.tenant_id', '=', 't.id')
            ->leftJoin('domains as d', 'd.tenant_id', '=', 'ti.tenant_id')
            ->select('ti.id as info_id', 'ti.tenant_id', 'ti.name', 'ti.subdomain', 'ti.status', 'ti.created_at', 't.data as tenant_data', 'd.domain')
            ->orderByDesc('ti.id')
            ->get();

        $tenants = $rows->map(function ($row) {
            $data = [];
            if (! empty($row->tenant_data)) {
                $decoded = json_decode((string) $row->tenant_data, true);
                $data = is_array($decoded) ? $decoded : [];
            }
            $plan = data_get($data, 'plan', data_get($data, 'subscription.plan', 'Starter'));

            $users_count = 0;
            $teachers_count = 0;
            $students_count = 0;
            $parents_count = 0;

            $tenant = Tenant::on($this->centralConnection())->find($row->tenant_id);
            if ($tenant) {
                $tenantDbExists = false;
                try {
                    $dbName = $tenant->database()->getName();
                    $tenantDbExists = $tenant->database()->manager()->databaseExists($dbName);
                } catch (\Throwable $e) {
                    $tenantDbExists = false;
                }
                if ($tenantDbExists) {
                    try {
                        $this->ensureTenantInitialized($tenant);
                        $tenantDb = DB::connection('tenant');
                        $sch = Schema::connection('tenant');
                        if ($sch->hasTable('users')) {
                            $users_count = (int) $tenantDb->table('users')->count();
                        }
                        if ($sch->hasTable('teachers')) {
                            $teachers_count = (int) $tenantDb->table('teachers')->count();
                        }
                        if ($sch->hasTable('students')) {
                            $students_count = (int) $tenantDb->table('students')->count();
                        }
                        if ($sch->hasTable('parents')) {
                            $parents_count = (int) $tenantDb->table('parents')->count();
                        }
                    } catch (\Throwable $e) {
                        // counts stay zero
                    } finally {
                        tenancy()->end();
                    }
                }
            }

            return [
                'id' => (int) $row->info_id,
                'name' => $row->name,
                'domain' => $row->domain ?: ($row->subdomain ? $row->subdomain . '.localhost' : ''),
                'slug' => $row->subdomain,
                'database' => data_get($data, 'tenancy_db_name'),
                'plan' => $plan,
                'users_count' => $users_count,
                'teachers_count' => $teachers_count,
                'students_count' => $students_count,
                'parents_count' => $parents_count,
                'subscription_status' => data_get($data, 'subscription.status', 'trial'),
                'status' => ((int) $row->status) === 1 ? 'active' : 'inactive',
                'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
            ];
        })->values();

        return response()->json($tenants);
    }

    public function store(Request $request): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }
        $conn = $this->centralConnection();

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'domain' => ['required', 'string', 'max:255', Rule::unique($conn . '.domains', 'domain')],
            'slug' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'plan' => ['nullable', 'string', 'max:100'],
        ]);

        $slug = ! empty($payload['slug']) ? Str::slug($payload['slug']) : Str::slug($payload['name']);
        if (! $slug) {
            $slug = 'tenant-' . Str::lower(Str::random(6));
        }
        if (Tenant::on($conn)->where('id', $slug)->exists()) {
            $slug = $slug . '-' . Str::lower(Str::random(4));
        }

        if (TenantInfo::on($conn)->where('subdomain', $slug)->exists()) {
            return response()->json(['message' => 'Subdomain already in use'], 422);
        }

        $plan = $payload['plan'] ?? 'Starter';
        $subscriptionStatus = (($payload['status'] ?? 'active') === 'active') ? 'trial' : 'cancelled';

        $tenant = null;
        try {
            // Eloquent create dispatches TenantCreated → CreateDatabase, MigrateDatabase, SetupTenant (sync)
            $tenant = Tenant::on($conn)->create([
                'id' => $slug,
                'plan' => $plan,
                'subscription' => [
                    'plan' => $plan,
                    'amount' => 0,
                    'billing_cycle' => 'monthly',
                    'status' => $subscriptionStatus,
                    'next_billing_date' => now()->addMonth()->toDateString(),
                ],
            ]);

            $tenant->domains()->create([
                'domain' => $payload['domain'],
            ]);

            $info = TenantInfo::on($conn)->create([
                'tenant_id' => $tenant->getTenantKey(),
                'name' => $payload['name'],
                'subdomain' => $slug,
                'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
            ]);

            return response()->json([
                'id' => (int) $info->id,
                'name' => $payload['name'],
                'domain' => $payload['domain'],
                'slug' => $slug,
                'plan' => $plan,
                'status' => ($payload['status'] ?? 'active'),
                'created_at' => now()->toDateString(),
            ]);
        } catch (\Throwable $e) {
            if ($tenant) {
                try {
                    $tenant->delete();
                } catch (\Throwable $cleanup) {
                    report($cleanup);
                }
            }
            report($e);

            return response()->json([
                'message' => 'Could not provision tenant database. ' . $e->getMessage(),
            ], 422);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }
        $conn = $this->centralConnection();

        $info = TenantInfo::on($conn)->find($id);
        if (! $info) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $domainRowId = DB::connection($conn)->table('domains')->where('tenant_id', $info->tenant_id)->value('id');

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'domain' => [
                'required',
                'string',
                'max:255',
                $domainRowId
                    ? Rule::unique($conn . '.domains', 'domain')->ignore((int) $domainRowId)
                    : Rule::unique($conn . '.domains', 'domain'),
            ],
            'status' => ['nullable', 'in:active,inactive'],
            'plan' => ['nullable', 'string', 'max:100'],
        ]);

        TenantInfo::on($conn)->where('id', $id)->update([
            'name' => $payload['name'],
            'status' => (($payload['status'] ?? 'active') === 'active') ? 1 : 0,
            'updated_at' => now(),
        ]);

        DB::connection($conn)->table('domains')->where('tenant_id', $info->tenant_id)->update([
            'domain' => $payload['domain'],
            'updated_at' => now(),
        ]);

        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && ! empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'plan', $payload['plan'] ?? data_get($data, 'plan', 'Starter'));
        data_set($data, 'subscription.plan', $payload['plan'] ?? data_get($data, 'subscription.plan', 'Starter'));
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($err = $this->denyUnlessPlatform($request)) {
            return $err;
        }
        $conn = $this->centralConnection();

        $info = TenantInfo::on($conn)->find($id);
        if (! $info) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $tenant = Tenant::on($conn)->find($info->tenant_id);
        if (! $tenant) {
            TenantInfo::on($conn)->where('id', $id)->delete();

            return response()->json(['ok' => true]);
        }

        $tenant->delete();

        return response()->json(['ok' => true]);
    }
}
