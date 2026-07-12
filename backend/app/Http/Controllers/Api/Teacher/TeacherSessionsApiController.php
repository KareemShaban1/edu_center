<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesTeacherApiContext;
use App\Http\Support\SessionTypeHelper;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TeacherSessionsApiController extends Controller
{
    use ResolvesTeacherApiContext;
    public function livekitToken(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
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

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        if (! \App\Services\LiveKitAccessTokenService::isConfigured()) {
            return response()->json(['message' => 'LiveKit is not configured'], 422);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $sectionIds = collect();
        if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('sections')->where('teacher_id', $teacherId)->pluck('id')
            );
        }
        if (Schema::connection('center')->hasTable('teacher_section')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('teacher_section')->where('teacher_id', $teacherId)->pluck('section_id')
            );
        }
        $sectionIds = $sectionIds->unique()->values();

        if ($sectionIds->isEmpty()) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $row = $tenantDb->table('sessions')
            ->where('id', $id)
            ->whereIn('section_id', $sectionIds)
            ->first();

        if (!$row || ($row->provider ?? '') !== 'livekit' || empty($row->room_slug)) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $token = \App\Services\LiveKitAccessTokenService::createToken(
            (string) $row->room_slug,
            'teacher-'.$teacherId,
            true,
            (bool) ($row->record_enabled ?? false)
        );

        return response()->json([
            'token' => $token,
            'url' => config('sessions.livekit.url'),
            'room' => $row->room_slug,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
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

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $sectionIds = collect();
        if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('sections')->where('teacher_id', $teacherId)->pluck('id')
            );
        }
        if (Schema::connection('center')->hasTable('teacher_section')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('teacher_section')->where('teacher_id', $teacherId)->pluck('section_id')
            );
        }
        $sectionIds = $sectionIds->unique()->values();

        if (!Schema::connection('center')->hasTable('sessions') || $sectionIds->isEmpty()) {
            return response()->json(['sessions' => []]);
        }

        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');

        $rows = $tenantDb->table('sessions')
            ->leftJoin('sections', 'sessions.section_id', '=', 'sections.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->whereIn('sessions.section_id', $sectionIds)
            ->select(
                'sessions.id',
                'sessions.grade_id',
                'sessions.class_id',
                'sessions.section_id',
                'sessions.topic',
                'sessions.start_at',
                'sessions.duration',
                'sessions.session_type',
                'sessions.provider',
                'sessions.room_slug',
                'sessions.join_url',
                'sessions.moderator_url',
                'sessions.password',
                'sessions.record_enabled',
                'sessions.external_ref',
                'sessions.created_by',
                DB::raw("trim(concat_ws(' - ', nullif(grades.grade_name, ''), nullif(classes.class_name, ''), nullif(sections.section_name, ''))) as section_label")
            );

        if ($hasLocationCol) {
            $rows->addSelect('sessions.location', 'sessions.notes');
        }

        $sessions = $rows->orderByDesc('sessions.start_at')->get()->map(function ($row) use ($hasLocationCol) {
            $m = [
                'id' => (int) $row->id,
                'grade_id' => (int) $row->grade_id,
                'class_id' => (int) $row->class_id,
                'section_id' => (int) $row->section_id,
                'section_label' => (string) ($row->section_label ?? ''),
                'topic' => (string) $row->topic,
                'start_at' => $row->start_at ? (string) $row->start_at : '',
                'duration' => (int) $row->duration,
                'session_type' => (string) ($row->session_type ?? 'online'),
                'provider' => (string) ($row->provider ?? ($row->session_type === 'offline' ? 'offline' : 'jitsi')),
                'room_slug' => $row->room_slug ?? null,
                'join_url' => $row->join_url ?? null,
                'moderator_url' => $row->moderator_url ?? null,
                'password' => $row->password ?? null,
                'record_enabled' => (bool) ($row->record_enabled ?? false),
                'external_ref' => $row->external_ref ?? null,
                'created_by' => (string) ($row->created_by ?? ''),
            ];
            if ($hasLocationCol) {
                $m['location'] = $row->location ?? '';
                $m['notes'] = $row->notes ?? '';
            }

            return $m;
        })->values();

        return response()->json(['sessions' => $sessions]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
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

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $sectionIds = collect();
        if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('sections')->where('teacher_id', $teacherId)->pluck('id')
            );
        }
        if (Schema::connection('center')->hasTable('teacher_section')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('teacher_section')->where('teacher_id', $teacherId)->pluck('section_id')
            );
        }
        $sectionIds = $sectionIds->unique()->values();

        if (!Schema::connection('center')->hasTable('sessions') || $sectionIds->isEmpty()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');

        $existing = $tenantDb->table('sessions')->where('id', $id)->first();
        if (!$existing || !$sectionIds->contains((int) ($existing->section_id ?? 0))) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $payload = $request->validate([
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],
            'session_type' => ['nullable', 'in:offline,online,exam,others'],
            'provider' => ['nullable', 'in:jitsi,livekit,external,offline,zoom,microsoft_teams,google_meet'],
            'join_url' => ['nullable', 'string', 'max:2000'],
            'moderator_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'max:255'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'record_enabled' => ['nullable', 'boolean'],
        ]);

        $sectionId = (int) $payload['section_id'];
        if (!$sectionIds->contains($sectionId)) {
            return response()->json(['message' => 'Section not allowed'], 422);
        }

        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) {
            return response()->json(['message' => 'Section not found'], 404);
        }
        $gradeId = (int) ($section->grade_id ?? 0);
        $classId = (int) ($section->class_id ?? 0);

        [$sessionType, $provider] = \App\Http\Support\SessionTypeHelper::resolveFromPayload($payload);
        $urlProviders = ['external', 'zoom', 'microsoft_teams', 'google_meet'];
        if ($sessionType === 'online' && in_array((string) $provider, $urlProviders, true) && empty($payload['join_url'])) {
            return response()->json(['message' => 'join_url is required for this provider'], 422);
        }
        if ($sessionType === 'offline' && empty($payload['location'])) {
            return response()->json(['message' => 'location is required for offline sessions'], 422);
        }

        $update = [
            'grade_id' => $gradeId,
            'class_id' => $classId,
            'section_id' => $sectionId,
            'topic' => (string) $payload['topic'],
            'start_at' => $payload['start_at'],
            'duration' => (int) $payload['duration'],
            'password' => $payload['password'] ?? null,
            'record_enabled' => (bool) ($payload['record_enabled'] ?? false),
            'session_type' => $sessionType,
            'provider' => $sessionType === 'online' ? $provider : null,
            'updated_at' => now(),
        ];
        if ($hasLocationCol) {
            $update['location'] = $payload['location'] ?? null;
            $update['notes'] = $payload['notes'] ?? null;
        }

        if ($sessionType === 'offline') {
            $update['room_slug'] = null;
            $update['join_url'] = '#';
            $update['moderator_url'] = null;
            $update['external_ref'] = null;
            $update['password'] = null;
        } elseif ($provider === 'jitsi') {
            if (($existing->provider ?? '') !== 'jitsi' || empty($existing->room_slug)) {
                $links = \App\Services\SessionLinkService::forJitsi();
                $update['room_slug'] = $links['room_slug'];
                $update['join_url'] = $links['join_url'];
                $update['moderator_url'] = $links['moderator_url'];
                $update['external_ref'] = null;
            }
        } elseif ($provider === 'livekit') {
            if (! \App\Services\LiveKitAccessTokenService::isConfigured()) {
                return response()->json(['message' => 'LiveKit is not configured on the server'], 422);
            }
            if (($existing->provider ?? '') !== 'livekit' || empty($existing->room_slug)) {
                $slug = \App\Services\SessionLinkService::generateRoomSlug();
                $links = \App\Services\SessionLinkService::forLiveKit($slug);
                $update['room_slug'] = $slug;
                $update['join_url'] = $links['join_url'];
                $update['moderator_url'] = $links['moderator_url'];
                $update['external_ref'] = null;
            }
        } else {
            $update['room_slug'] = null;
            $update['join_url'] = (string) $payload['join_url'];
            $update['moderator_url'] = $payload['moderator_url'] ?? null;
            $update['external_ref'] = $payload['external_ref'] ?? null;
        }

        try {
            $tenantDb->table('sessions')->where('id', $id)->update($update);
        } catch (QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                return response()->json(['message' => 'A session with this series and start time already exists.'], 422);
            }
            throw $e;
        }

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
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

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $sectionIds = collect();
        if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('sections')->where('teacher_id', $teacherId)->pluck('id')
            );
        }
        if (Schema::connection('center')->hasTable('teacher_section')) {
            $sectionIds = $sectionIds->merge(
                $tenantDb->table('teacher_section')->where('teacher_id', $teacherId)->pluck('section_id')
            );
        }
        $sectionIds = $sectionIds->unique()->values();

        if (!Schema::connection('center')->hasTable('sessions') || $sectionIds->isEmpty()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $deleted = $tenantDb->table('sessions')
            ->where('id', $id)
            ->whereIn('section_id', $sectionIds)
            ->delete();
        if (!$deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['ok' => true]);
    }

}
