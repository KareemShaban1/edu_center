<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Centers\CenterMembershipService;
use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Parents;
use App\Models\Platform\CenterMembership;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminStudentsApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function searchByCode(Request $request): JsonResponse
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
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $this->ensureTenantInitialized($tenant);

        if (! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $payload = $request->validate([
            'code' => ['required', 'string', 'max:50'],
        ]);

        $query = DB::connection('mysql')->table('students')->where('code', $payload['code']);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $student = $query->first();
        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $isAssigned = \App\Models\Platform\CenterMembership::query()
            ->where('center_id', $tenant->id)
            ->where('user_id', $student->id)
            ->where('user_type', \App\Models\Student::class)
            ->where('status', \App\Models\Platform\CenterMembership::STATUS_ASSIGNED)
            ->exists();

        $parent = null;
        if ($student->parent_id) {
            $parentRow = DB::connection('mysql')->table('parents')->where('id', $student->parent_id)->first();
            if ($parentRow) {
                $parentAssigned = \App\Models\Platform\CenterMembership::query()
                    ->where('center_id', $tenant->id)
                    ->where('user_id', $parentRow->id)
                    ->where('user_type', \App\Models\Parents::class)
                    ->where('status', \App\Models\Platform\CenterMembership::STATUS_ASSIGNED)
                    ->exists();

                $parent = [
                    'id' => $parentRow->id,
                    'name' => $parentRow->parent_name,
                    'email' => $parentRow->email,
                    'is_assigned' => $parentAssigned,
                ];
            }
        }

        return response()->json([
            'student' => [
                'id' => $student->id,
                'code' => $student->code,
                'name' => $student->name,
                'email' => $student->email,
                'gender' => $student->gender,
                'parent_id' => $student->parent_id,
                'is_assigned' => $isAssigned,
            ],
            'parent' => $parent,
        ]);
    }

    public function postAssignCenter(Request $request, int $id): JsonResponse
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
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $this->ensureTenantInitialized($tenant);

        if (! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $studentQuery = DB::connection('mysql')->table('students')->where('id', $id);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentQuery->whereNull('deleted_at');
        }

        $student = $studentQuery->first();
        if (! $student) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        app(\App\Centers\CenterMembershipService::class)->assignStudentWithParent($tenant, $id);

        return response()->json([
            'message' => 'Student and parent assigned to center successfully.',
            'student_id' => $id,
            'center_id' => $tenant->id,
        ]);
    }

    public function postUnassignCenter(Request $request, int $id): JsonResponse
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
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $this->ensureTenantInitialized($tenant);

        if (! Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $studentQuery = DB::connection('mysql')->table('students')->where('id', $id);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentQuery->whereNull('deleted_at');
        }

        if (! $studentQuery->exists()) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $membership = app(\App\Centers\CenterMembershipService::class)->unassignStudentWithParent($tenant, $id);
        if (! $membership) {
            return response()->json(['message' => 'Student is not assigned to this center'], 422);
        }

        return response()->json([
            'message' => 'Student unassigned from center. They can be reassigned later.',
            'student_id' => $id,
            'center_id' => $tenant->id,
            'membership_status' => \App\Models\Platform\CenterMembership::STATUS_NOT_ASSIGNED,
        ]);
    }

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
            'code' => ['required', 'string', 'max:50', 'unique:mysql.students,code'],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.students,email'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:mysql.students,phone'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'gender' => ['required', 'in:male,female'],
            'status' => ['nullable', 'string'],
            'grade_id' => ['required', 'integer', 'min:1', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'min:1', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'min:1', 'exists:center.sections,id'],
            'parent_id' => ['nullable', 'integer', 'exists:center.parents,id'],
        ]);

        $academicYear = now()->year.'-'.(now()->year + 1);
        $studentsHasIsActive = Schema::connection('center')->hasColumn('students', 'is_active');
        $insert = [
            'name' => $payload['name'],
            'code' => $payload['code'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'gender' => $payload['gender'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'parent_id' => !empty($payload['parent_id']) ? $payload['parent_id'] : null,
            'academic_year' => $academicYear,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($studentsHasIsActive) {
            $insert['is_active'] = (($payload['status'] ?? 'active') !== 'inactive');
        }
        if (Schema::connection('center')->hasColumn('students', 'phone') && ! empty($payload['phone'])) {
            $insert['phone'] = preg_replace('/\s+/', '', trim((string) $payload['phone']));
        }

        $id = DB::connection('center')->table('students')->insertGetId($insert);

        app(\App\Centers\CenterMembershipService::class)->assignStudentWithParent($tenant, (int) $id);

        $student = DB::connection('center')->table('students')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'code' => $student->code,
                'name' => $student->name,
                'email' => $student->email,
                'gender' => $student->gender,
                'status' => isset($student->is_active) ? ($student->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
                'grade_id' => $student->grade_id,
                'classroom_id' => $student->class_id,
                'section_id' => $student->section_id,
                'parent_id' => $student->parent_id,
                'created_at' => optional($student->created_at)->format('Y-m-d') ?? now()->toDateString(),
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

        $studentExists = DB::connection('center')->table('students')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->exists();
        if (!$studentExists) {
            return response()->json(['message' => 'Student not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:mysql.students,code,'.$id],
            'email' => ['required', 'email', 'max:255', 'unique:mysql.students,email,'.$id],
            'phone' => ['nullable', 'string', 'max:20', 'unique:mysql.students,phone,'.$id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'gender' => ['required', 'in:male,female'],
            'status' => ['nullable', 'string'],
            'grade_id' => ['required', 'integer', 'min:1', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'min:1', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'min:1', 'exists:center.sections,id'],
            'parent_id' => ['nullable', 'integer', 'exists:center.parents,id'],
        ]);

        $update = [
            'name' => $payload['name'],
            'code' => $payload['code'],
            'email' => $payload['email'],
            'gender' => $payload['gender'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'parent_id' => !empty($payload['parent_id']) ? $payload['parent_id'] : null,
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('students', 'is_active')) {
            $update['is_active'] = (($payload['status'] ?? 'active') !== 'inactive');
        }
        if (Schema::connection('center')->hasColumn('students', 'phone')) {
            $update['phone'] = ! empty($payload['phone'])
                ? preg_replace('/\s+/', '', trim((string) $payload['phone']))
                : null;
        }
        if (!empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }

        DB::connection('center')->table('students')
            ->where('id', $id)
            ->update($update);

        app(\App\Centers\CenterMembershipService::class)->assignStudentWithParent($tenant, $id);

        $student = DB::connection('center')->table('students')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'code' => $student->code,
                'name' => $student->name,
                'email' => $student->email,
                'gender' => $student->gender,
                'status' => isset($student->is_active) ? ($student->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
                'grade_id' => $student->grade_id,
                'classroom_id' => $student->class_id,
                'section_id' => $student->section_id,
                'parent_id' => $student->parent_id,
                'created_at' => optional($student->created_at)->format('Y-m-d') ?? now()->toDateString(),
            ],
        ]);
    }

}
