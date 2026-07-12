<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminClassesApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function store(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $insert = [
            'class_name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('classes', 'notes')) {
            $insert['notes'] = $payload['notes'] ?? null;
        }

        $id = DB::connection('center')->table('classes')->insertGetId($insert);
        return response()->json(['class' => ['id' => $id, 'name' => $payload['name'], 'grade_id' => $payload['grade_id'], 'notes' => $payload['notes'] ?? null]], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $exists = DB::connection('center')->table('classes')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Class not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $update = [
            'class_name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('classes', 'notes')) {
            $update['notes'] = $payload['notes'] ?? null;
        }

        DB::connection('center')->table('classes')->where('id', $id)->update($update);
        return response()->json(['class' => ['id' => $id, 'name' => $payload['name'], 'grade_id' => $payload['grade_id'], 'notes' => $payload['notes'] ?? null]]);
    }

}
