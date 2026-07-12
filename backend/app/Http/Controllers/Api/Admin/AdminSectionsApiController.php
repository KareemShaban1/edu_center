<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Http\Support\SectionWeekDays;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminSectionsApiController extends Controller
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

        $payload = $request->validate(array_merge([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:center.teachers,id'],
        ], Schema::connection('center')->hasColumn('sections', 'week_days') ? SectionWeekDays::validationRules() : []));

        $insert = [
            'section_name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['class_id'],
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $insert['teacher_id'] = $payload['teacher_id'] ?? null;
        }
        if (Schema::connection('center')->hasColumn('sections', 'week_days')) {
            $insert['week_days'] = SectionWeekDays::encode($payload['week_days'] ?? null);
        }

        $id = DB::connection('center')->table('sections')->insertGetId($insert);
        if (Schema::connection('center')->hasTable('teacher_section')) {
            DB::connection('center')->table('teacher_section')->where('section_id', $id)->delete();
            if (!empty($payload['teacher_id'])) {
                DB::connection('center')->table('teacher_section')->insert([
                    'teacher_id' => (int) $payload['teacher_id'],
                    'section_id' => (int) $id,
                ]);
            }
        }
        $weekDays = SectionWeekDays::decode($insert['week_days'] ?? null);

        return response()->json(['section' => [
            'id' => $id,
            'name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['class_id'],
            'teacher_id' => $payload['teacher_id'] ?? null,
            'week_days' => $weekDays,
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

        $exists = DB::connection('center')->table('sections')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Section not found'], 404);

        $payload = $request->validate(array_merge([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:center.teachers,id'],
        ], Schema::connection('center')->hasColumn('sections', 'week_days') ? SectionWeekDays::validationRules() : []));

        $update = [
            'section_name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['class_id'],
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $update['teacher_id'] = $payload['teacher_id'] ?? null;
        }
        if (Schema::connection('center')->hasColumn('sections', 'week_days')) {
            $update['week_days'] = SectionWeekDays::encode($payload['week_days'] ?? null);
        }

        DB::connection('center')->table('sections')->where('id', $id)->update($update);
        if (Schema::connection('center')->hasTable('teacher_section')) {
            DB::connection('center')->table('teacher_section')->where('section_id', $id)->delete();
            if (!empty($payload['teacher_id'])) {
                DB::connection('center')->table('teacher_section')->insert([
                    'teacher_id' => (int) $payload['teacher_id'],
                    'section_id' => (int) $id,
                ]);
            }
        }

        return response()->json(['section' => [
            'id' => $id,
            'name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['class_id'],
            'teacher_id' => $payload['teacher_id'] ?? null,
            'week_days' => SectionWeekDays::decode($update['week_days'] ?? null),
        ]]);
    }

    public function sessions(Request $request, int $sectionId): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
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

        if (!Schema::connection('center')->hasTable('sessions')) {
            return response()->json(['section' => null, 'sessions' => []]);
        }

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->where('sections.id', $sectionId)
            ->select(
                'sections.id',
                'sections.section_name as name',
                'sections.grade_id',
                'sections.class_id',
                'grades.grade_name as grade_name',
                'classes.class_name as class_name'
            )
            ->first();

        if (!$section) {
            return response()->json(['message' => 'Section not found'], 404);
        }

        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');
        $hasSessionOnAttendance = Schema::connection('center')->hasColumn('attendances', 'session_id');
        $hasSessionOnExam = Schema::connection('center')->hasColumn('exam_degrees', 'session_id');
        $hasSessionOnQuiz = Schema::connection('center')->hasColumn('quiz_degrees', 'session_id');
        $examHasAttendance = Schema::connection('center')->hasColumn('exam_degrees', 'attendance_status');
        $quizHasAttendance = Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status');

        $mapAttendanceStatus = function ($value): string {
            $n = (int) $value;
            if ($n === 0) {
                return 'absent';
            }
            if ($n === 2) {
                return 'late';
            }

            return 'present';
        };

        $sessionRows = $tenantDb->table('sessions')
            ->where('section_id', $sectionId)
            ->orderByDesc('start_at')
            ->get();

        $sessionIds = $sessionRows->pluck('id')->map(fn ($id) => (int) $id)->all();

        $attendanceBySession = collect();
        if ($hasSessionOnAttendance && !empty($sessionIds)) {
            $attendanceBySession = $tenantDb->table('attendances')
                ->leftJoin('students', 'attendances.student_id', '=', 'students.id')
                ->whereIn('attendances.session_id', $sessionIds)
                ->select(
                    'attendances.session_id',
                    'attendances.student_id',
                    'students.name as student_name',
                    'attendances.attendance_date',
                    'attendances.attendance_status',
                    'attendances.notes'
                )
                ->get()
                ->groupBy('session_id');
        }

        $examsBySession = collect();
        if ($hasSessionOnExam && !empty($sessionIds)) {
            $examCols = ['exam_degrees.session_id', 'exam_degrees.student_id', 'students.name as student_name', 'exam_degrees.exam_date', 'exam_degrees.degree', 'exam_degrees.notes'];
            if ($examHasAttendance) {
                $examCols[] = 'exam_degrees.attendance_status';
            }
            $examsBySession = $tenantDb->table('exam_degrees')
                ->leftJoin('students', 'exam_degrees.student_id', '=', 'students.id')
                ->whereIn('exam_degrees.session_id', $sessionIds)
                ->select($examCols)
                ->get()
                ->groupBy('session_id');
        }

        $quizzesBySession = collect();
        if ($hasSessionOnQuiz && !empty($sessionIds)) {
            $quizCols = ['quiz_degrees.session_id', 'quiz_degrees.student_id', 'students.name as student_name', 'quiz_degrees.quiz_date', 'quiz_degrees.degree', 'quiz_degrees.notes'];
            if ($quizHasAttendance) {
                $quizCols[] = 'quiz_degrees.attendance_status';
            }
            $quizzesBySession = $tenantDb->table('quiz_degrees')
                ->leftJoin('students', 'quiz_degrees.student_id', '=', 'students.id')
                ->whereIn('quiz_degrees.session_id', $sessionIds)
                ->select($quizCols)
                ->get()
                ->groupBy('session_id');
        }

        $sessions = $sessionRows->map(function ($row) use (
            $hasLocationCol,
            $attendanceBySession,
            $examsBySession,
            $quizzesBySession,
            $mapAttendanceStatus,
            $examHasAttendance,
            $quizHasAttendance
        ) {
            $sessionId = (int) $row->id;
            $attendanceRecords = ($attendanceBySession->get($sessionId) ?? collect())->map(function ($r) use ($mapAttendanceStatus) {
                return [
                    'student_id' => (int) $r->student_id,
                    'student_name' => (string) ($r->student_name ?? ''),
                    'date' => $r->attendance_date ? (string) $r->attendance_date : '',
                    'status' => $mapAttendanceStatus($r->attendance_status),
                    'notes' => $r->notes ?? '',
                ];
            })->values();

            $examRecords = ($examsBySession->get($sessionId) ?? collect())->map(function ($r) use ($examHasAttendance) {
                $status = 'present';
                if ($examHasAttendance && isset($r->attendance_status) && in_array($r->attendance_status, ['present', 'absent', 'late'], true)) {
                    $status = $r->attendance_status;
                } elseif (strtoupper((string) $r->degree) === 'ABSENT') {
                    $status = 'absent';
                }

                return [
                    'student_id' => (int) $r->student_id,
                    'student_name' => (string) ($r->student_name ?? ''),
                    'date' => $r->exam_date ? (string) $r->exam_date : '',
                    'degree' => (string) ($r->degree ?? ''),
                    'status' => $status,
                    'notes' => $r->notes ?? '',
                ];
            })->values();

            $quizRecords = ($quizzesBySession->get($sessionId) ?? collect())->map(function ($r) use ($quizHasAttendance) {
                $status = 'present';
                if ($quizHasAttendance && isset($r->attendance_status) && in_array($r->attendance_status, ['present', 'absent', 'late'], true)) {
                    $status = $r->attendance_status;
                } elseif (strtoupper((string) $r->degree) === 'ABSENT') {
                    $status = 'absent';
                }

                return [
                    'student_id' => (int) $r->student_id,
                    'student_name' => (string) ($r->student_name ?? ''),
                    'date' => $r->quiz_date ? (string) $r->quiz_date : '',
                    'degree' => (string) ($r->degree ?? ''),
                    'status' => $status,
                    'notes' => $r->notes ?? '',
                ];
            })->values();

            $present = $attendanceRecords->where('status', 'present')->count();
            $absent = $attendanceRecords->where('status', 'absent')->count();
            $late = $attendanceRecords->where('status', 'late')->count();

            $session = [
                'id' => $sessionId,
                'topic' => (string) $row->topic,
                'start_at' => $row->start_at ? (string) $row->start_at : '',
                'duration' => (int) $row->duration,
                'session_type' => (string) ($row->session_type ?? 'online'),
                'provider' => $row->provider,
                'join_url' => $row->join_url ?? null,
                'location' => $hasLocationCol ? ($row->location ?? '') : '',
                'notes' => $hasLocationCol ? ($row->notes ?? '') : '',
                'created_by' => (string) ($row->created_by ?? ''),
                'attendance' => [
                    'total' => $attendanceRecords->count(),
                    'present' => $present,
                    'absent' => $absent,
                    'late' => $late,
                    'records' => $attendanceRecords,
                ],
                'exams' => [
                    'total' => $examRecords->count(),
                    'records' => $examRecords,
                ],
                'quizzes' => [
                    'total' => $quizRecords->count(),
                    'records' => $quizRecords,
                ],
            ];

            return $session;
        })->values();

        return response()->json([
            'section' => [
                'id' => (int) $section->id,
                'name' => (string) $section->name,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
                'grade_name' => (string) ($section->grade_name ?? ''),
                'class_name' => (string) ($section->class_name ?? ''),
            ],
            'sessions' => $sessions,
        ]);
    }

}
