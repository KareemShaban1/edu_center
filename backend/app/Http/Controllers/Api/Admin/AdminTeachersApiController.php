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

class AdminTeachersApiController extends Controller
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
            'email' => ['required', 'email', 'max:255', 'unique:mysql.teachers,email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'specialization' => ['nullable', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:20'],
            'gender' => ['required', 'in:male,female'],
            'status' => ['nullable', 'in:active,inactive'],
            'class_ids' => ['nullable', 'array'],
            'class_ids.*' => ['integer', 'exists:center.classes,id'],
        ]);

        $teachersHasIsActive = Schema::connection('center')->hasColumn('teachers', 'is_active');
        $insert = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'subject' => $payload['specialization'] ?? null,
            'phone' => $payload['phone'],
            'gender' => $payload['gender'],
            'joining_date' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($teachersHasIsActive) {
            $insert['is_active'] = ($payload['status'] ?? 'active') === 'active';
        }

        $teacherId = DB::connection('center')->table('teachers')->insertGetId($insert);

        $classIds = collect($payload['class_ids'] ?? [])->map(fn ($id) => (int) $id)->unique()->values()->all();
        if (Schema::connection('center')->hasTable('teacher_section')) {
            $sectionIds = [];
            if (!empty($classIds) && Schema::connection('center')->hasTable('sections')) {
                $sectionIds = DB::connection('center')->table('sections')
                    ->whereIn('class_id', $classIds)
                    ->pluck('id')
                    ->map(fn ($id) => (int) $id)
                    ->values()
                    ->all();
            }
            if (!empty($sectionIds)) {
                DB::connection('center')->table('teacher_section')->insert(
                    collect($sectionIds)->map(fn ($sectionId) => ['teacher_id' => $teacherId, 'section_id' => $sectionId])->all()
                );
            }
        }

        $teacher = DB::connection('center')->table('teachers')->where('id', $teacherId)->first();

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'specialization' => $teacher->subject,
                'phone' => $teacher->phone,
                'gender' => $teacher->gender,
                'status' => isset($teacher->is_active) ? ($teacher->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
                'joining_date' => $teacher->joining_date,
                'class_ids' => $classIds,
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

        $teacherExists = DB::connection('center')->table('teachers')->where('id', $id)->exists();
        if (!$teacherExists) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.teachers,email,'.$id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'specialization' => ['nullable', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:20'],
            'gender' => ['required', 'in:male,female'],
            'status' => ['nullable', 'in:active,inactive'],
            'class_ids' => ['nullable', 'array'],
            'class_ids.*' => ['integer', 'exists:center.classes,id'],
        ]);

        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'subject' => $payload['specialization'] ?? null,
            'phone' => $payload['phone'],
            'gender' => $payload['gender'],
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('teachers', 'is_active')) {
            $update['is_active'] = ($payload['status'] ?? 'active') === 'active';
        }
        if (!empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }

        DB::connection('center')->table('teachers')->where('id', $id)->update($update);

        $classIds = collect($payload['class_ids'] ?? [])->map(fn ($cid) => (int) $cid)->unique()->values()->all();
        if (Schema::connection('center')->hasTable('teacher_section')) {
            DB::connection('center')->table('teacher_section')->where('teacher_id', $id)->delete();
            if (!empty($classIds) && Schema::connection('center')->hasTable('sections')) {
                $sectionIds = DB::connection('center')->table('sections')
                    ->whereIn('class_id', $classIds)
                    ->pluck('id')
                    ->map(fn ($sid) => (int) $sid)
                    ->values()
                    ->all();
                if (!empty($sectionIds)) {
                    DB::connection('center')->table('teacher_section')->insert(
                        collect($sectionIds)->map(fn ($sid) => ['teacher_id' => $id, 'section_id' => $sid])->all()
                    );
                }
            }
        }

        $teacher = DB::connection('center')->table('teachers')->where('id', $id)->first();

        return response()->json([
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->email,
                'specialization' => $teacher->subject,
                'phone' => $teacher->phone,
                'gender' => $teacher->gender,
                'status' => isset($teacher->is_active) ? ($teacher->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
                'joining_date' => $teacher->joining_date,
                'class_ids' => $classIds,
            ],
        ]);
    }

}
