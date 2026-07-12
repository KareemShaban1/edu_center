<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AdminLessonsApiController extends Controller
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
            'unit_id' => ['required', 'integer', 'exists:center.units,id'],
            'notes' => ['nullable', 'string'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ]);

        $uploadedFiles = AdminUploadHelper::validatedFiles($request);

        $lesson = Lesson::query()->find($id);
        if (! $lesson) return response()->json(['message' => 'Lesson not found'], 404);

        $lesson->name = $payload['name'];
        $lesson->unit_id = (int) $payload['unit_id'];
        $lesson->notes = $payload['notes'] ?? '';
        if (Schema::connection('center')->hasColumn('lessons', 'center_id') && ! $lesson->center_id) {
            $lesson->center_id = $tenant->id;
        }
        $lesson->save();

        $removeIds = collect($payload['remove_media_ids'] ?? [])->map(fn ($v) => (int) $v)->filter()->values();
        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', Lesson::class)
                ->where('model_id', $lesson->id)
                ->get()
                ->each(fn ($m) => $m->delete());
        }

        if ($uploadedFiles !== []) {
            foreach ($uploadedFiles as $file) {
                $lesson->addMedia($file)->toMediaCollection('lessons');
            }
        }

        $media = $lesson->getMedia('lessons')->map(function ($m) {
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
            'lesson' => [
                'id' => $lesson->id,
                'name' => $lesson->name,
                'unit_id' => $lesson->unit_id,
                'notes' => $lesson->notes,
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

        $exists = DB::connection('center')->table('lessons')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Lesson not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit_id' => ['required', 'integer', 'exists:center.units,id'],
            'notes' => ['nullable', 'string'],
        ]);
        DB::connection('center')->table('lessons')->where('id', $id)->update([
            'name' => $payload['name'],
            'unit_id' => $payload['unit_id'],
            'notes' => $payload['notes'] ?? '',
            'updated_at' => now(),
        ]);
        return response()->json(['lesson' => ['id' => $id, 'name' => $payload['name'], 'unit_id' => $payload['unit_id'], 'notes' => $payload['notes'] ?? '']]);
    }

}
