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

class AdminFeesApiController extends Controller
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
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:20'],
            'month' => ['required', 'string', 'max:20'],
            'type' => ['required', 'in:monthly,half-monthly,book,other'],
        ]);

        $insert = [
            'title' => $payload['title'],
            'amount' => $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? null,
            'month' => $payload['month'],
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('fees', 'center_id')) {
            $insert['center_id'] = $tenant->id;
        }
        if (Schema::connection('center')->hasColumn('fees', 'fee_type')) {
            $insert['fee_type'] = $payload['type'];
        } elseif (Schema::connection('center')->hasColumn('fees', 'Fee_type')) {
            $insert['Fee_type'] = $payload['type'];
        }

        $id = DB::connection('center')->table('fees')->insertGetId($insert);

        return response()->json(['fee' => [
            'id' => $id,
            'title' => $payload['title'],
            'amount' => (float) $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? '',
            'month' => $payload['month'],
            'type' => $payload['type'],
        ]], 201);
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

        $exists = DB::connection('center')->table('fees')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Fee not found'], 404);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:20'],
            'month' => ['required', 'string', 'max:20'],
            'type' => ['required', 'in:monthly,half-monthly,book,other'],
        ]);

        $update = [
            'title' => $payload['title'],
            'amount' => $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? null,
            'month' => $payload['month'],
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('fees', 'center_id')) {
            $existingCenterId = DB::connection('center')->table('fees')->where('id', $id)->value('center_id');
            if (! $existingCenterId) {
                $update['center_id'] = $tenant->id;
            }
        }
        if (Schema::connection('center')->hasColumn('fees', 'fee_type')) {
            $update['fee_type'] = $payload['type'];
        } elseif (Schema::connection('center')->hasColumn('fees', 'Fee_type')) {
            $update['Fee_type'] = $payload['type'];
        }

        DB::connection('center')->table('fees')->where('id', $id)->update($update);

        return response()->json(['fee' => [
            'id' => $id,
            'title' => $payload['title'],
            'amount' => (float) $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? '',
            'month' => $payload['month'],
            'type' => $payload['type'],
        ]]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        DB::connection('center')->table('fees')->where('id', $id)->delete();
        return response()->json(['message' => 'Fee deleted']);
    }

}
