<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesAdminApiContext;
use App\Models\Attendance;
use App\Models\Student;
use App\Notifications\ParentAttendanceNotification;
use App\Notifications\StudentAttendanceNotification;
use App\Services\NotificationDispatchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminAttendanceApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function sectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['message' => 'Invalid date format'], 422);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $students = $tenantDb->table('students')
            ->where('section_id', $sectionId)
            ->whereNull('deleted_at')
            ->get(['id', 'name', 'grade_id', 'class_id', 'section_id']);

        $hasSessionOnAttendance = Schema::connection('center')->hasColumn('attendances', 'session_id');
        $filterSessionId = $request->query('session_id') ? (int) $request->query('session_id') : null;
        $attendanceQuery = $tenantDb->table('attendances')
            ->where('section_id', $sectionId)
            ->whereDate('attendance_date', $date);
        if ($filterSessionId && $hasSessionOnAttendance) {
            $attendanceQuery->where('session_id', $filterSessionId);
        }
        $attendanceByStudent = $attendanceQuery
            ->get(['student_id', 'attendance_status', 'notes'])
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($attendanceByStudent) {
            $record = $attendanceByStudent->get($student->id);
            $status = 'present';
            if ($record) {
                $value = (int) $record->attendance_status;
                $status = $value === 0 ? 'absent' : ($value === 2 ? 'late' : 'present');
            }

            return [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'grade_id' => $student->grade_id,
                'class_id' => $student->class_id,
                'section_id' => $student->section_id,
                'status' => $status,
                'notes' => $record?->notes ?? '',
            ];
        })->values();

        $sessionOptions = collect();
        if (Schema::connection('center')->hasTable('sessions')) {
            $sessionOptions = $tenantDb->table('sessions')
                ->where('section_id', $sectionId)
                ->orderByDesc('start_at')
                ->limit(100)
                ->get(['id', 'topic', 'start_at', 'session_type'])
                ->map(fn ($s) => [
                    'id' => (int) $s->id,
                    'topic' => (string) $s->topic,
                    'start_at' => (string) $s->start_at,
                    'session_type' => (string) ($s->session_type ?? 'online'),
                ])->values();
        }
        $sessionId = $filterSessionId;
        if (!$sessionId && $hasSessionOnAttendance) {
            $linked = $tenantDb->table('attendances')
                ->where('section_id', $sectionId)
                ->whereDate('attendance_date', $date)
                ->whereNotNull('session_id')
                ->value('session_id');
            $sessionId = $linked ? (int) $linked : null;
        }

        return response()->json([
            'date' => $date,
            'section' => [
                'id' => (int) $section->id,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
            ],
            'session_id' => $sessionId,
            'session_options' => $sessionOptions,
            'rows' => $rows,
        ]);
    }

    public function sectionHistory(Request $request, int $sectionId): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $history = $tenantDb->table('attendances')
            ->where('section_id', $sectionId)
            ->select(
                DB::raw('DATE(attendance_date) as date'),
                DB::raw('SUM(CASE WHEN attendance_status = 1 THEN 1 ELSE 0 END) as present'),
                DB::raw('SUM(CASE WHEN attendance_status = 0 THEN 1 ELSE 0 END) as absent'),
                DB::raw('SUM(CASE WHEN attendance_status = 2 THEN 1 ELSE 0 END) as late'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy(DB::raw('DATE(attendance_date)'))
            ->orderByDesc(DB::raw('DATE(attendance_date)'))
            ->get()
            ->map(function ($row) {
                return [
                    'date' => $row->date,
                    'present' => (int) $row->present,
                    'absent' => (int) $row->absent,
                    'late' => (int) $row->late,
                    'total' => (int) $row->total,
                ];
            })
            ->values();

        return response()->json([
            'section' => [
                'id' => (int) $section->id,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
            ],
            'days' => $history,
        ]);
    }

    public function postSectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['message' => 'Invalid date format'], 422);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'session_id' => ['nullable', 'integer', 'exists:center.sessions,id'],
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.status' => ['required', 'in:present,absent,late'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $sessionId = isset($payload['session_id']) ? (int) $payload['session_id'] : null;
        if ($sessionId) {
            $sessionRow = $tenantDb->table('sessions')->where('id', $sessionId)->where('section_id', $sectionId)->first();
            if (!$sessionRow) {
                return response()->json(['message' => 'session_id does not belong to this section'], 422);
            }
        }

        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        $statusMap = ['present' => 1, 'absent' => 0, 'late' => 2];
        $hasSessionCol = Schema::connection('center')->hasColumn('attendances', 'session_id');

        foreach ($payload['rows'] as $row) {
            $student = $students->get($row['student_id']);
            if (!$student || (int) $student->section_id !== $sectionId) {
                continue;
            }

            $exists = $tenantDb->table('attendances')
                ->where('student_id', $row['student_id'])
                ->whereDate('attendance_date', $date)
                ->exists();

            $data = [
                'student_id' => (int) $row['student_id'],
                'grade_id' => (int) $student->grade_id,
                'class_id' => (int) $student->class_id,
                'section_id' => (int) $student->section_id,
                'attendance_date' => $date,
                'attendance_status' => $statusMap[$row['status']] ?? 1,
                'notes' => $row['notes'] ?? null,
                'updated_at' => now(),
            ];
            if ($hasSessionCol) {
                $data['session_id'] = $sessionId;
            }

            if ($exists) {
                $tenantDb->table('attendances')
                    ->where('student_id', $row['student_id'])
                    ->whereDate('attendance_date', $date)
                    ->update($data);
            } else {
                $data['created_at'] = now();
                $tenantDb->table('attendances')->insert($data);
            }
        }

        $autoNotify = $request->boolean('notify', true);
        if ($autoNotify) {
            $dispatcher = app(NotificationDispatchService::class);
            foreach ($payload['rows'] as $row) {
                $student = \App\Models\Student::query()->find($row['student_id']);
                if (! $student) {
                    continue;
                }
                $attendance = \App\Models\Attendance::query()
                    ->where('student_id', $row['student_id'])
                    ->whereDate('attendance_date', $date)
                    ->first();
                if (! $attendance) {
                    continue;
                }

                $dispatcher->dispatch($student, new StudentAttendanceNotification($attendance), true);

                $parent = $student->parents;
                if ($parent) {
                    $dispatcher->dispatch($parent, new ParentAttendanceNotification($attendance), true);
                }
            }
        }

        return response()->json(['message' => 'Attendance saved']);
    }

}
