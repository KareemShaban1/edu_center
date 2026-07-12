<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AdminUnitsApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function store(Request $request, int $id): JsonResponse
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
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'notes' => ['nullable', 'string'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ]);

        $uploadedFiles = AdminUploadHelper::validatedFiles($request);

        $unit = Unit::query()->find($id);
        if (! $unit) return response()->json(['message' => 'Unit not found'], 404);

        $unit->name = $payload['name'];
        $unit->class_id = (int) $payload['class_id'];
        $unit->notes = $payload['notes'] ?? '';
        if (Schema::connection('center')->hasColumn('units', 'center_id') && ! $unit->center_id) {
            $unit->center_id = $tenant->id;
        }
        $unit->save();

        $removeIds = collect($payload['remove_media_ids'] ?? [])->map(fn ($v) => (int) $v)->filter()->values();
        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', Unit::class)
                ->where('model_id', $unit->id)
                ->get()
                ->each(fn ($m) => $m->delete());
        }

        if ($uploadedFiles !== []) {
            foreach ($uploadedFiles as $file) {
                $unit->addMedia($file)->toMediaCollection('units');
            }
        }

        $media = $unit->getMedia('units')->map(function ($m) {
            return [
                'id' => (int) $m->id,
                'name' => $m->name ?: $m->file_name,
                'file_name' => $m->file_name,
                'mime_type' => $m->mime_type,
                'size' => (int) $m->size,
                'type' => $m->mime_type ?: 'application/octet-stream',
                'url' => $m->getUrl(),
            ];
        })->values();

        return response()->json([
            'unit' => [
                'id' => $unit->id,
                'name' => $unit->name,
                'class_id' => $unit->class_id,
                'notes' => $unit->notes,
                'media' => $media,
            ],
        ]);
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

        $exists = DB::connection('center')->table('units')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Unit not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'notes' => ['nullable', 'string'],
        ]);
        DB::connection('center')->table('units')->where('id', $id)->update([
            'name' => $payload['name'],
            'class_id' => $payload['class_id'],
            'notes' => $payload['notes'] ?? '',
            'updated_at' => now(),
        ]);
        return response()->json(['unit' => ['id' => $id, 'name' => $payload['name'], 'class_id' => $payload['class_id'], 'notes' => $payload['notes'] ?? '']]);
    }

}
