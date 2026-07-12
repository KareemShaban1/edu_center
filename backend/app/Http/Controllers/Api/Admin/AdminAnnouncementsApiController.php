<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\AdminUploadHelper;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Announcement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AdminAnnouncementsApiController extends Controller
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
        $items = $tenantDb->table('announcements')
            ->leftJoin('grades', 'announcements.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'announcements.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'announcements.section_id', '=', 'sections.id')
            ->whereNull('announcements.deleted_at')
            ->select(
                'announcements.id',
                'announcements.grade_id',
                'announcements.class_id',
                'announcements.section_id',
                'announcements.title',
                'announcements.body',
                'announcements.time',
                'announcements.announcement_type',
                'announcements.created_at',
                'grades.grade_name as grade_name',
                'classes.class_name as class_name',
                'sections.section_name as section_name'
            )
            ->orderByDesc('announcements.id')
            ->get()
            ->map(function ($row) {
                $announcement = Announcement::query()->find($row->id);
                $media = collect();
                if ($announcement) {
                    $media = $announcement->getMedia('announcements')->map(function ($m) {
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
                    'grade_id' => (int) $row->grade_id,
                    'class_id' => (int) $row->class_id,
                    'section_id' => (int) $row->section_id,
                    'title' => $row->title,
                    'content' => $row->body,
                    'time' => $row->time ? \Illuminate\Support\Carbon::parse($row->time)->format('Y-m-d\TH:i') : null,
                    'type' => $row->announcement_type ?: 'others',
                    'grade_name' => $row->grade_name ?: '',
                    'class_name' => $row->class_name ?: '',
                    'section_name' => $row->section_name ?: '',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                    'media' => $media,
                ];
            })
            ->values();

        return response()->json(['announcements' => $items]);
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
            'content' => ['required', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:quiz,exam,others'],
            'time' => ['nullable', 'date'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ]);

        $uploadedFiles = AdminUploadHelper::validatedFiles($request);

        $announcement = Announcement::query()->find($id);
        if (!$announcement) return response()->json(['message' => 'Announcement not found'], 404);

        $announcement->title = $payload['title'];
        $announcement->body = $payload['content'];
        $announcement->grade_id = (int) $payload['grade_id'];
        $announcement->class_id = (int) $payload['class_id'];
        $announcement->section_id = (int) $payload['section_id'];
        $announcement->announcement_type = $payload['type'];
        $announcement->time = $payload['time'] ?? null;
        if (Schema::connection('center')->hasColumn('announcements', 'center_id') && ! $announcement->center_id) {
            $announcement->center_id = $tenant->id;
        }
        $announcement->save();

        $removeIds = collect($payload['remove_media_ids'] ?? [])->map(fn ($v) => (int) $v)->filter()->values();
        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', Announcement::class)
                ->where('model_id', $announcement->id)
                ->get()
                ->each(fn ($m) => $m->delete());
        }

        if ($uploadedFiles !== []) {
            foreach ($uploadedFiles as $file) {
                $announcement->addMedia($file)->toMediaCollection('announcements');
            }
        }

        $tenantDb = DB::connection('center');
        $gradeName = $tenantDb->table('grades')->where('id', $announcement->grade_id)->value('grade_name');
        $className = $tenantDb->table('classes')->where('id', $announcement->class_id)->value('class_name');
        $sectionName = $tenantDb->table('sections')->where('id', $announcement->section_id)->value('section_name');

        return response()->json([
            'announcement' => [
                'id' => (int) $announcement->id,
                'grade_id' => (int) $announcement->grade_id,
                'class_id' => (int) $announcement->class_id,
                'section_id' => (int) $announcement->section_id,
                'title' => $announcement->title,
                'content' => $announcement->body,
                'time' => $announcement->time ? \Illuminate\Support\Carbon::parse($announcement->time)->format('Y-m-d\TH:i') : null,
                'type' => $announcement->announcement_type ?: 'others',
                'grade_name' => $gradeName ?: '',
                'class_name' => $className ?: '',
                'section_name' => $sectionName ?: '',
                'created_at' => optional($announcement->created_at)->format('Y-m-d') ?? now()->toDateString(),
                'media' => $announcement->getMedia('announcements')->map(function ($m) {
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

        $announcement = Announcement::query()->find($id);
        if (!$announcement) return response()->json(['message' => 'Announcement not found'], 404);
        $announcement->clearMediaCollection('announcements');
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }

}
