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

class AdminQuizzesApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function sectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);
        $students = $tenantDb->table('students')->where('section_id', $sectionId)->whereNull('deleted_at')->get(['id', 'name']);
        $quizHasAttendance = Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status');
        $quizHasSession = Schema::connection('center')->hasColumn('quiz_degrees', 'session_id');
        $filterSessionId = $request->query('session_id') ? (int) $request->query('session_id') : null;
        $quizCols = ['student_id', 'degree', 'notes'];
        if ($quizHasAttendance) $quizCols[] = 'attendance_status';
        $recordsQuery = $tenantDb->table('quiz_degrees')->where('section_id', $sectionId)->whereDate('quiz_date', $date);
        if ($filterSessionId && $quizHasSession) {
            $recordsQuery->where('session_id', $filterSessionId);
        }
        $records = $recordsQuery->get($quizCols)->keyBy('student_id');
        $rows = $students->map(function ($s) use ($records) {
            $r = $records->get($s->id);
            $status = 'present';
            if ($r && isset($r->attendance_status) && in_array($r->attendance_status, ['present', 'absent', 'late'], true)) {
                $status = $r->attendance_status;
            } elseif ($r) {
                $status = strtoupper((string) $r->degree) === 'ABSENT' ? 'absent' : 'present';
            }
            return [
                'student_id' => (int) $s->id,
                'student_name' => $s->name,
                'status' => $status,
                'degree' => $r && $status !== 'absent' ? (string) $r->degree : '',
                'notes' => $r?->notes ?? '',
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
        if (!$sessionId && $quizHasSession) {
            $linked = $tenantDb->table('quiz_degrees')
                ->where('section_id', $sectionId)
                ->whereDate('quiz_date', $date)
                ->whereNotNull('session_id')
                ->value('session_id');
            $sessionId = $linked ? (int) $linked : null;
        }
        return response()->json(['date' => $date, 'section' => ['id' => (int) $section->id, 'grade_id' => (int) $section->grade_id, 'class_id' => (int) $section->class_id], 'session_id' => $sessionId, 'session_options' => $sessionOptions, 'rows' => $rows]);
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
        $days = DB::connection('center')->table('quiz_degrees')
            ->where('section_id', $sectionId)
            ->select(DB::raw('DATE(quiz_date) as date'), DB::raw('COUNT(*) as students_count'))
            ->groupBy(DB::raw('DATE(quiz_date)'))
            ->orderByDesc(DB::raw('DATE(quiz_date)'))
            ->get()
            ->map(fn ($d) => ['date' => $d->date, 'quiz_name' => 'Quiz', 'students_count' => (int) $d->students_count])
            ->values();
        return response()->json(['days' => $days]);
    }

    public function postSectionDate(Request $request, int $sectionId, string $date): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
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
            'rows.*.degree' => ['nullable', 'string', 'max:10'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);
        $tenantDb = DB::connection('center');
        $sessionId = isset($payload['session_id']) ? (int) $payload['session_id'] : null;
        if ($sessionId) {
            $sessionRow = $tenantDb->table('sessions')->where('id', $sessionId)->where('section_id', $sectionId)->first();
            if (!$sessionRow) {
                return response()->json(['message' => 'session_id does not belong to this section'], 422);
            }
        }
        $quizHasAttendance = Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status');
        $quizHasSession = Schema::connection('center')->hasColumn('quiz_degrees', 'session_id');
        $students = $tenantDb->table('students')->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())->get(['id', 'grade_id', 'class_id', 'section_id'])->keyBy('id');
        foreach ($payload['rows'] as $row) {
            $s = $students->get($row['student_id']);
            if (!$s || (int) $s->section_id !== $sectionId) continue;
            $exists = $tenantDb->table('quiz_degrees')->where('student_id', $row['student_id'])->whereDate('quiz_date', $date)->exists();
            $data = [
                'student_id' => (int) $row['student_id'],
                'grade_id' => (int) $s->grade_id,
                'class_id' => (int) $s->class_id,
                'section_id' => (int) $s->section_id,
                'quiz_date' => $date,
                'degree' => $row['status'] === 'absent' ? '' : (string) ($row['degree'] ?? '0'),
                'notes' => $row['notes'] ?? null,
                'updated_at' => now(),
            ];
            if ($quizHasAttendance) {
                $data['attendance_status'] = $row['status'];
            }
            if ($quizHasSession) {
                $data['session_id'] = $sessionId;
            }
            if ($exists) {
                $tenantDb->table('quiz_degrees')->where('student_id', $row['student_id'])->whereDate('quiz_date', $date)->update($data);
            } else {
                $data['created_at'] = now();
                $tenantDb->table('quiz_degrees')->insert($data);
            }
        }
        return response()->json(['message' => 'Quiz results saved']);
    }

}
