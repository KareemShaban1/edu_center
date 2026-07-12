<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Centers\CenterMembershipService;
use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Parents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminParentsApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function store(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $this->ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.parents,email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'phone' => ['required', 'string', 'max:20', 'unique:mysql.parents,parent_phone'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'address' => ['nullable', 'string', 'max:300'],
        ]);

        $parentsHasIsActive = Schema::connection('center')->hasColumn('parents', 'is_active');
        $insert = [
            'parent_name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'parent_phone' => $payload['phone'] ?? null,
            'parent_job' => $payload['job_title'] ?? null,
            'parent_address' => $payload['address'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($parentsHasIsActive) {
            $insert['is_active'] = ($payload['status'] ?? 'active') === 'active';
        }

        $id = DB::connection('center')->table('parents')->insertGetId($insert);

        app(CenterMembershipService::class)->assignMembership($tenant, (int) $id, Parents::class);

        $parent = DB::connection('center')->table('parents')->where('id', $id)->first();

        return response()->json([
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->parent_name,
                'email' => $parent->email,
                'phone' => $parent->parent_phone,
                'job_title' => $parent->parent_job,
                'address' => $parent->parent_address,
                'status' => isset($parent->is_active) ? ($parent->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
            ],
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $this->ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $exists = DB::connection('center')->table('parents')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Parent not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.parents,email,'.$id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'phone' => ['required', 'string', 'max:20', 'unique:mysql.parents,parent_phone,'.$id],
            'job_title' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'address' => ['nullable', 'string', 'max:300'],
        ]);

        $update = [
            'parent_name' => $payload['name'],
            'email' => $payload['email'],
            'parent_phone' => $payload['phone'] ?? null,
            'parent_job' => $payload['job_title'] ?? null,
            'parent_address' => $payload['address'] ?? null,
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('parents', 'is_active')) {
            $update['is_active'] = ($payload['status'] ?? 'active') === 'active';
        }
        if (!empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }

        DB::connection('center')->table('parents')->where('id', $id)->update($update);

        $parent = DB::connection('center')->table('parents')->where('id', $id)->first();

        return response()->json([
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->parent_name,
                'email' => $parent->email,
                'phone' => $parent->parent_phone,
                'job_title' => $parent->parent_job,
                'address' => $parent->parent_address,
                'status' => isset($parent->is_active) ? ($parent->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
            ],
        ]);
    }

}
