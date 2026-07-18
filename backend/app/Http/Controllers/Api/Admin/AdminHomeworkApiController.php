<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\StudentHomework;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminHomeworkApiController extends Controller
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
            'content' => ['nullable', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'start_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
        ]);

        $id = DB::connection('center')->table('homeworks')->insertGetId([
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'submit_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['homework' => [
            'id' => $id,
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'start_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
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

        $exists = DB::connection('center')->table('homeworks')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Homework not found'], 404);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['nullable', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'start_date' => ['required', 'date'],
            'due_date' => ['required', 'date'],
        ]);

        DB::connection('center')->table('homeworks')->where('id', $id)->update([
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'submit_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
            'updated_at' => now(),
        ]);

        return response()->json(['homework' => [
            'id' => $id,
            'title' => $payload['title'],
            'content' => $payload['content'] ?? '',
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'start_date' => $payload['start_date'],
            'due_date' => $payload['due_date'],
        ]]);
    }

    public function submissions(Request $request, int $id): JsonResponse
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

        $tenantDb = DB::connection('center');
        if (! Schema::connection('center')->hasTable('homeworks')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $homework = $tenantDb->table('homeworks')
            ->leftJoin('grades', 'homeworks.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'homeworks.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'homeworks.section_id', '=', 'sections.id')
            ->where('homeworks.id', $id)
            ->first([
                'homeworks.id',
                'homeworks.title',
                'homeworks.content',
                'homeworks.grade_id',
                'homeworks.class_id',
                'homeworks.section_id',
                'homeworks.submit_date as start_date',
                'homeworks.due_date',
                'grades.grade_name',
                'classes.class_name',
                'sections.section_name',
            ]);
        if (! $homework) {
            return response()->json(['message' => 'Homework not found'], 404);
        }

        $studentsQuery = $tenantDb->table('students')->where('section_id', (int) $homework->section_id);
        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentsQuery->whereNull('deleted_at');
        }
        $students = $studentsQuery->orderBy('name')->get(['id', 'name']);

        $submissionsByStudent = collect();
        if (Schema::connection('center')->hasTable('student_homework')) {
            $submissionsByStudent = StudentHomework::query()
                ->where('homework_id', $id)
                ->get()
                ->keyBy('student_id');
        }

        $rows = $students->map(function ($student) use ($submissionsByStudent) {
            $submission = $submissionsByStudent->get($student->id);
            if (! $submission) {
                return [
                    'student_id' => (int) $student->id,
                    'student_name' => (string) $student->name,
                    'submission_id' => null,
                    'status' => 'not_submitted',
                    'degree' => '',
                    'rate' => '',
                    'student_notes' => '',
                    'response' => '',
                    'upload_date' => '',
                    'file_url' => null,
                    'file_name' => null,
                    'correction_url' => null,
                    'correction_name' => null,
                ];
            }

            return $submission->toAdminSubmissionArray((string) $student->name);
        })->values();

        return response()->json([
            'homework' => [
                'id' => (int) $homework->id,
                'title' => (string) $homework->title,
                'content' => (string) ($homework->content ?? ''),
                'grade_id' => (int) $homework->grade_id,
                'classroom_id' => (int) $homework->class_id,
                'section_id' => (int) $homework->section_id,
                'grade_name' => (string) ($homework->grade_name ?? ''),
                'class_name' => (string) ($homework->class_name ?? ''),
                'section_name' => (string) ($homework->section_name ?? ''),
                'start_date' => (string) $homework->start_date,
                'due_date' => (string) $homework->due_date,
            ],
            'submissions' => $rows,
        ]);
    }

    public function showSubmission(Request $request, int $id): JsonResponse
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

        if (! Schema::connection('center')->hasTable('student_homework')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $submission = StudentHomework::query()->find($id);
        if (! $submission) {
            return response()->json(['message' => 'Submission not found'], 404);
        }

        $tenantDb = DB::connection('center');
        $homework = $tenantDb->table('homeworks')
            ->leftJoin('grades', 'homeworks.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'homeworks.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'homeworks.section_id', '=', 'sections.id')
            ->where('homeworks.id', $submission->homework_id)
            ->first([
                'homeworks.id',
                'homeworks.title',
                'homeworks.content',
                'homeworks.grade_id',
                'homeworks.class_id',
                'homeworks.section_id',
                'homeworks.submit_date as start_date',
                'homeworks.due_date',
                'grades.grade_name',
                'classes.class_name',
                'sections.section_name',
            ]);
        if (! $homework) {
            return response()->json(['message' => 'Homework not found'], 404);
        }

        $student = $tenantDb->table('students')->where('id', $submission->student_id)->first();

        return response()->json([
            'homework' => [
                'id' => (int) $homework->id,
                'title' => (string) $homework->title,
                'content' => (string) ($homework->content ?? ''),
                'grade_id' => (int) $homework->grade_id,
                'classroom_id' => (int) $homework->class_id,
                'section_id' => (int) $homework->section_id,
                'grade_name' => (string) ($homework->grade_name ?? ''),
                'class_name' => (string) ($homework->class_name ?? ''),
                'section_name' => (string) ($homework->section_name ?? ''),
                'start_date' => (string) $homework->start_date,
                'due_date' => (string) $homework->due_date,
            ],
            'submission' => $submission->toAdminSubmissionArray((string) ($student->name ?? '')),
        ]);
    }

    public function updateSubmissions(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('student_homework')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $payload = $request->validate([
            'status' => ['required', 'in:submitted,late,approved,rejected'],
            'degree' => ['nullable', 'string', 'max:100'],
            'rate' => ['nullable', 'string', 'max:100'],
            'response' => ['nullable', 'string'],
        ]);

        $submission = StudentHomework::query()->find($id);
        if (!$submission) return response()->json(['message' => 'Submission not found'], 404);

        $submission->status = $payload['status'];
        $submission->degree = $payload['degree'] ?? null;
        $submission->rate = $payload['rate'] ?? null;
        $submission->response = $payload['response'] ?? null;
        $submission->save();

        $student = DB::connection('center')->table('students')->where('id', $submission->student_id)->first();

        return response()->json([
            'submission' => $submission->toAdminSubmissionArray((string) ($student->name ?? '')),
        ]);
    }

    public function postSubmissionsCorrection(Request $request, int $id): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('student_homework')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $request->validate([
            'correction' => ['required', 'file', 'mimes:pdf,png,jpg,jpeg', 'max:20480'],
        ]);

        $submission = StudentHomework::query()->find($id);
        if (!$submission) return response()->json(['message' => 'Submission not found'], 404);

        $submission->clearMediaCollection('correction');
        $submission->addMedia($request->file('correction'))->toMediaCollection('correction');
        $submission->refresh();

        $student = DB::connection('center')->table('students')->where('id', $submission->student_id)->first();

        return response()->json([
            'submission' => $submission->toAdminSubmissionArray((string) ($student->name ?? '')),
        ]);
    }

}
