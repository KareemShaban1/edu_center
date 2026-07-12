<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Library;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AdminLibraryApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function index(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $items = $tenantDb->table('library')
            ->leftJoin('grades', 'library.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'library.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'library.section_id', '=', 'sections.id')
            ->whereNull('library.deleted_at')
            ->select(
                'library.id',
                'library.title',
                'library.grade_id',
                'library.class_id',
                'library.section_id',
                'library.type',
                'library.notes',
                'library.created_at',
                'grades.grade_name as grade_name',
                'classes.class_name as class_name',
                'sections.section_name as section_name'
            )
            ->orderByDesc('library.id')
            ->get()
            ->map(function ($row) {
                $library = Library::query()->find($row->id);
                $media = collect();
                if ($library) {
                    $media = $library->getMedia('library')->map(function ($m) {
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
                }

                return [
                    'id' => (int) $row->id,
                    'title' => $row->title,
                    'grade_id' => (int) $row->grade_id,
                    'class_id' => (int) $row->class_id,
                    'section_id' => (int) $row->section_id,
                    'type' => $row->type ?: 'resource',
                    'notes' => $row->notes ?: '',
                    'grade_name' => $row->grade_name ?: '',
                    'class_name' => $row->class_name ?: '',
                    'section_name' => $row->section_name ?: '',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                    'media' => $media,
                ];
            })
            ->values();

        return response()->json(['library' => $items]);
    }

    public function store(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ]);

        $uploadedFiles = AdminUploadHelper::validatedFiles($request);

        $library = Library::query()->find($id);
        if (!$library) return response()->json(['message' => 'Library item not found'], 404);

        $library->title = $payload['title'];
        $library->grade_id = (int) $payload['grade_id'];
        $library->class_id = (int) $payload['class_id'];
        $library->section_id = (int) $payload['section_id'];
        $library->type = $payload['type'];
        $library->notes = $payload['notes'] ?? null;
        if (Schema::connection('center')->hasColumn('library', 'center_id') && ! $library->center_id) {
            $library->center_id = $tenant->id;
        }
        $library->save();

        $removeIds = collect($payload['remove_media_ids'] ?? [])->map(fn ($v) => (int) $v)->filter()->values();
        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', Library::class)
                ->where('model_id', $library->id)
                ->get()
                ->each(fn ($m) => $m->delete());
        }

        if ($uploadedFiles !== []) {
            foreach ($uploadedFiles as $file) {
                $library->addMedia($file)->toMediaCollection('library');
            }
        }

        $tenantDb = DB::connection('center');
        $gradeName = $tenantDb->table('grades')->where('id', $library->grade_id)->value('grade_name');
        $className = $tenantDb->table('classes')->where('id', $library->class_id)->value('class_name');
        $sectionName = $tenantDb->table('sections')->where('id', $library->section_id)->value('section_name');

        return response()->json([
            'library' => [
                'id' => (int) $library->id,
                'title' => $library->title,
                'grade_id' => (int) $library->grade_id,
                'class_id' => (int) $library->class_id,
                'section_id' => (int) $library->section_id,
                'type' => $library->type,
                'notes' => $library->notes ?? '',
                'grade_name' => $gradeName ?: '',
                'class_name' => $className ?: '',
                'section_name' => $sectionName ?: '',
                'created_at' => optional($library->created_at)->format('Y-m-d') ?? now()->toDateString(),
                'media' => $library->getMedia('library')->map(function ($m) {
                    return [
                        'id' => (int) $m->id,
                        'name' => $m->name ?: $m->file_name,
                        'file_name' => $m->file_name,
                        'mime_type' => $m->mime_type,
                        'size' => (int) $m->size,
                        'type' => $m->mime_type ?: 'application/octet-stream',
                        'url' => $m->getUrl(),
                    ];
                })->values(),
            ],
        ]);
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
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $library = Library::query()->find($id);
        if (!$library) return response()->json(['message' => 'Library item not found'], 404);
        $library->clearMediaCollection('library');
        $library->delete();
        return response()->json(['message' => 'Library item deleted']);
    }

}
