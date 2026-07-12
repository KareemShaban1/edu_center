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

class AdminReportsApiController extends Controller
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
        $hasTable = fn (string $table) => Schema::connection('center')->hasTable($table);
        $hasColumn = fn (string $table, string $column) => Schema::connection('center')->hasTable($table) && Schema::connection('center')->hasColumn($table, $column);

        $studentsCount = $hasTable('students') ? (int) $tenantDb->table('students')->whereNull('deleted_at')->count() : 0;
        $teachersCount = $hasTable('teachers') ? (int) $tenantDb->table('teachers')->count() : 0;
        $parentsCount = $hasTable('parents') ? (int) $tenantDb->table('parents')->count() : 0;
        $gradesCount = $hasTable('grades') ? (int) $tenantDb->table('grades')->count() : 0;
        $classesCount = $hasTable('classes') ? (int) $tenantDb->table('classes')->count() : 0;
        $sectionsCount = $hasTable('sections') ? (int) $tenantDb->table('sections')->count() : 0;

        $attendanceRate = 0.0;
        if ($hasTable('attendances')) {
            $total = (int) $tenantDb->table('attendances')->count();
            if ($total > 0) {
                $presentOrLate = (int) $tenantDb->table('attendances')
                    ->whereIn('attendance_status', [1, 2])
                    ->count();
                $attendanceRate = round(($presentOrLate / $total) * 100, 2);
            }
        }

        $attendanceByGrade = collect();
        if ($hasTable('attendances') && $hasTable('students') && $hasTable('grades')) {
            $attendanceByGrade = $tenantDb->table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->join('grades', 'students.grade_id', '=', 'grades.id')
                ->select(
                    'grades.id as grade_id',
                    'grades.grade_name as grade_name',
                    DB::raw('COUNT(attendances.id) as total'),
                    DB::raw('SUM(CASE WHEN attendances.attendance_status IN (1,2) THEN 1 ELSE 0 END) as attended')
                )
                ->groupBy('grades.id', 'grades.grade_name')
                ->get()
                ->map(fn ($r) => [
                    'grade_id' => (int) $r->grade_id,
                    'grade_name' => $r->grade_name,
                    'rate' => ((int) $r->total) > 0 ? round(((int) $r->attended / (int) $r->total) * 100, 2) : 0,
                    'total' => (int) $r->total,
                ])
                ->values();
        }

        $feesTotal = $hasTable('fees') ? (float) ($tenantDb->table('fees')->sum('amount') ?? 0) : 0.0;
        $paymentsCount = $hasTable('payments') ? (int) $tenantDb->table('payments')->count() : 0;
        $collectedAmount = $hasTable('payments')
            ? (float) ($tenantDb->table('payments')->where('payment_status', 1)->sum('amount') ?? 0)
            : 0.0;
        $unpaidCount = $hasTable('payments')
            ? (int) $tenantDb->table('payments')->where('payment_status', 0)->count()
            : 0;

        $revenueBreakdown = collect();
        if ($hasTable('fees') && $hasTable('payments')) {
            $feeTypeExpr = $hasColumn('fees', 'fee_type')
                ? 'fees.fee_type'
                : ($hasColumn('fees', 'Fee_type') ? 'fees.Fee_type' : "'other'");
            $revenueBreakdown = $tenantDb->table('payments')
                ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
                ->select(
                    DB::raw("$feeTypeExpr as type"),
                    DB::raw('SUM(CASE WHEN payments.payment_status = 1 THEN COALESCE(payments.amount,0) ELSE 0 END) as collected')
                )
                ->groupBy(DB::raw($feeTypeExpr))
                ->get()
                ->map(fn ($r) => [
                    'type' => $r->type ?: 'other',
                    'collected' => (float) $r->collected,
                ])
                ->sortByDesc('collected')
                ->values();
        }

        $examRecords = $hasTable('exam_degrees') ? (int) $tenantDb->table('exam_degrees')->count() : 0;
        $quizRecords = $hasTable('quiz_degrees') ? (int) $tenantDb->table('quiz_degrees')->count() : 0;
        $libraryItems = $hasTable('library') ? (int) $tenantDb->table('library')->whereNull('deleted_at')->count() : 0;
        $announcementsCount = $hasTable('announcements') ? (int) $tenantDb->table('announcements')->whereNull('deleted_at')->count() : 0;

        $availableReports = collect([
            ['key' => 'students', 'title' => 'Students report', 'count' => $studentsCount],
            ['key' => 'teachers', 'title' => 'Teachers report', 'count' => $teachersCount],
            ['key' => 'parents', 'title' => 'Parents report', 'count' => $parentsCount],
            ['key' => 'attendance', 'title' => 'Attendance report', 'count' => $hasTable('attendances') ? (int) $tenantDb->table('attendances')->count() : 0],
            ['key' => 'fees', 'title' => 'Fees report', 'count' => $hasTable('fees') ? (int) $tenantDb->table('fees')->count() : 0],
            ['key' => 'payments', 'title' => 'Payments report', 'count' => $paymentsCount],
            ['key' => 'exams', 'title' => 'Exams report', 'count' => $examRecords],
            ['key' => 'quizzes', 'title' => 'Quizzes report', 'count' => $quizRecords],
            ['key' => 'library', 'title' => 'Library report', 'count' => $libraryItems],
            ['key' => 'announcements', 'title' => 'Announcements report', 'count' => $announcementsCount],
        ])->values();

        return response()->json([
            'stats' => [
                'students' => $studentsCount,
                'teachers' => $teachersCount,
                'parents' => $parentsCount,
                'grades' => $gradesCount,
                'classes' => $classesCount,
                'sections' => $sectionsCount,
                'attendance_rate' => $attendanceRate,
                'fees_total' => round($feesTotal, 2),
                'payments_count' => $paymentsCount,
                'collected_amount' => round($collectedAmount, 2),
                'unpaid_count' => $unpaidCount,
                'exam_records' => $examRecords,
                'quiz_records' => $quizRecords,
                'library_items' => $libraryItems,
                'announcements' => $announcementsCount,
            ],
            'attendance_by_grade' => $attendanceByGrade,
            'revenue_breakdown' => $revenueBreakdown,
            'available_reports' => $availableReports,
        ]);
    }

    public function show(Request $request, string $type): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (! in_array($type, ['attendance', 'exams', 'quizzes', 'payments'], true)) {
            return response()->json(['message' => 'Invalid report type'], 422);
        }
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $this->ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $hasTable = fn (string $table) => Schema::connection('center')->hasTable($table);
        $hasColumn = fn (string $table, string $column) => Schema::connection('center')->hasTable($table) && Schema::connection('center')->hasColumn($table, $column);

        if ($type === 'attendance') {
            $total = $hasTable('attendances') ? (int) $tenantDb->table('attendances')->count() : 0;
            $present = 0;
            $absent = 0;
            if ($hasTable('attendances')) {
                $present = (int) $tenantDb->table('attendances')->where('attendance_status', 1)->count();
                $absent = max(0, $total - $present);
            }
            $rate = $total > 0 ? round(($present / $total) * 100, 2) : 0.0;

            $byGrade = collect();
            if ($hasTable('attendances') && $hasTable('grades')) {
                $byGrade = $tenantDb->table('attendances')
                    ->join('grades', 'attendances.grade_id', '=', 'grades.id')
                    ->select(
                        'grades.id as grade_id',
                        'grades.grade_name as grade_name',
                        DB::raw('COUNT(attendances.id) as total'),
                        DB::raw('SUM(CASE WHEN attendances.attendance_status = 1 THEN 1 ELSE 0 END) as attended')
                    )
                    ->groupBy('grades.id', 'grades.grade_name')
                    ->get()
                    ->map(fn ($r) => [
                        'grade_id' => (int) $r->grade_id,
                        'grade_name' => $r->grade_name,
                        'total' => (int) $r->total,
                        'rate' => ((int) $r->total) > 0 ? round(((int) $r->attended / (int) $r->total) * 100, 2) : 0,
                    ])
                    ->values();
            }

            $recent = collect();
            if ($hasTable('attendances') && $hasTable('students')) {
                $recent = $tenantDb->table('attendances')
                    ->leftJoin('students', 'attendances.student_id', '=', 'students.id')
                    ->leftJoin('grades', 'attendances.grade_id', '=', 'grades.id')
                    ->leftJoin('classes', 'attendances.class_id', '=', 'classes.id')
                    ->leftJoin('sections', 'attendances.section_id', '=', 'sections.id')
                    ->select(
                        'attendances.id',
                        'students.name as student_name',
                        'grades.grade_name',
                        'classes.class_name',
                        'sections.section_name',
                        'attendances.attendance_date as date',
                        'attendances.attendance_status as status'
                    )
                    ->orderByDesc('attendances.attendance_date')
                    ->limit(25)
                    ->get()
                    ->map(fn ($r) => [
                        'id' => (int) $r->id,
                        'student_name' => $r->student_name ?: '—',
                        'grade_name' => $r->grade_name ?: '—',
                        'class_name' => $r->class_name ?: '—',
                        'section_name' => $r->section_name ?: '—',
                        'date' => $r->date,
                        'status' => (int) $r->status === 1 ? 'present' : 'absent',
                    ])
                    ->values();
            }

            return response()->json([
                'type' => 'attendance',
                'stats' => [
                    ['key' => 'total_records', 'value' => $total],
                    ['key' => 'attendance_rate', 'value' => $rate],
                    ['key' => 'present_count', 'value' => $present],
                    ['key' => 'absent_count', 'value' => $absent],
                ],
                'by_grade' => $byGrade,
                'recent' => $recent,
            ]);
        }

        if ($type === 'exams' || $type === 'quizzes') {
            $table = $type === 'exams' ? 'exam_degrees' : 'quiz_degrees';
            $dateCol = $type === 'exams' ? 'exam_date' : 'quiz_date';
            $total = $hasTable($table) ? (int) $tenantDb->table($table)->count() : 0;

            $avgDegree = 0.0;
            if ($hasTable($table)) {
                $degrees = $tenantDb->table($table)->pluck('degree');
                $numeric = $degrees->map(fn ($d) => is_numeric($d) ? (float) $d : null)->filter();
                $avgDegree = $numeric->isNotEmpty() ? round($numeric->avg(), 2) : 0.0;
            }

            $byGrade = collect();
            if ($hasTable($table) && $hasTable('grades')) {
                $rows = $tenantDb->table($table)
                    ->join('grades', "$table.grade_id", '=', 'grades.id')
                    ->select('grades.id as grade_id', 'grades.grade_name as grade_name', DB::raw("COUNT($table.id) as total"))
                    ->groupBy('grades.id', 'grades.grade_name')
                    ->get();
                $byGrade = $rows->map(function ($r) use ($tenantDb, $table) {
                    $degrees = $tenantDb->table($table)->where('grade_id', $r->grade_id)->pluck('degree');
                    $numeric = $degrees->map(fn ($d) => is_numeric($d) ? (float) $d : null)->filter();
                    return [
                        'grade_id' => (int) $r->grade_id,
                        'grade_name' => $r->grade_name,
                        'total' => (int) $r->total,
                        'rate' => $numeric->isNotEmpty() ? round($numeric->avg(), 2) : 0,
                    ];
                })->values();
            }

            $recent = collect();
            if ($hasTable($table) && $hasTable('students')) {
                $recent = $tenantDb->table($table)
                    ->leftJoin('students', "$table.student_id", '=', 'students.id')
                    ->leftJoin('grades', "$table.grade_id", '=', 'grades.id')
                    ->leftJoin('classes', "$table.class_id", '=', 'classes.id')
                    ->leftJoin('sections', "$table.section_id", '=', 'sections.id')
                    ->select(
                        "$table.id",
                        'students.name as student_name',
                        'grades.grade_name',
                        'classes.class_name',
                        'sections.section_name',
                        "$table.$dateCol as date",
                        "$table.degree as degree",
                        "$table.attendance_status as status"
                    )
                    ->orderByDesc("$table.$dateCol")
                    ->limit(25)
                    ->get()
                    ->map(fn ($r) => [
                        'id' => (int) $r->id,
                        'student_name' => $r->student_name ?: '—',
                        'grade_name' => $r->grade_name ?: '—',
                        'class_name' => $r->class_name ?: '—',
                        'section_name' => $r->section_name ?: '—',
                        'date' => $r->date,
                        'degree' => $r->degree,
                        'status' => $r->status ?: '—',
                    ])
                    ->values();
            }

            return response()->json([
                'type' => $type,
                'stats' => [
                    ['key' => 'total_records', 'value' => $total],
                    ['key' => 'average_degree', 'value' => $avgDegree],
                ],
                'by_grade' => $byGrade,
                'recent' => $recent,
            ]);
        }

        // payments
        $paymentsCount = $hasTable('payments') ? (int) $tenantDb->table('payments')->count() : 0;
        $collectedAmount = $hasTable('payments')
            ? (float) ($tenantDb->table('payments')->where('payment_status', 1)->sum('amount') ?? 0)
            : 0.0;
        $unpaidCount = $hasTable('payments')
            ? (int) $tenantDb->table('payments')->where('payment_status', 0)->count()
            : 0;
        $feesTotal = $hasTable('fees') ? (float) ($tenantDb->table('fees')->sum('amount') ?? 0) : 0.0;

        $byFeeType = collect();
        if ($hasTable('fees') && $hasTable('payments')) {
            $feeTypeExpr = $hasColumn('fees', 'fee_type')
                ? 'fees.fee_type'
                : ($hasColumn('fees', 'Fee_type') ? 'fees.Fee_type' : "'other'");
            $byFeeType = $tenantDb->table('payments')
                ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
                ->select(
                    DB::raw("$feeTypeExpr as type"),
                    DB::raw('SUM(CASE WHEN payments.payment_status = 1 THEN COALESCE(payments.amount,0) ELSE 0 END) as collected'),
                    DB::raw('COUNT(payments.id) as total')
                )
                ->groupBy(DB::raw($feeTypeExpr))
                ->get()
                ->map(fn ($r) => [
                    'grade_name' => ucfirst(str_replace('_', ' ', (string) ($r->type ?: 'other'))),
                    'total' => (int) $r->total,
                    'rate' => round((float) $r->collected, 2),
                ])
                ->sortByDesc('rate')
                ->values();
        }

        $recent = collect();
        if ($hasTable('payments') && $hasTable('students')) {
            $recent = $tenantDb->table('payments')
                ->leftJoin('students', 'payments.student_id', '=', 'students.id')
                ->leftJoin('grades', 'payments.grade_id', '=', 'grades.id')
                ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
                ->select(
                    'payments.id',
                    'students.name as student_name',
                    'grades.grade_name',
                    'payments.payment_date as date',
                    'payments.amount',
                    'payments.payment_status as status',
                    'payments.month'
                )
                ->orderByDesc('payments.payment_date')
                ->limit(25)
                ->get()
                ->map(fn ($r) => [
                    'id' => (int) $r->id,
                    'student_name' => $r->student_name ?: '—',
                    'grade_name' => $r->grade_name ?: '—',
                    'date' => $r->date,
                    'degree' => $r->amount !== null ? number_format((float) $r->amount, 2) : '—',
                    'status' => (int) $r->status === 1 ? 'paid' : 'unpaid',
                    'class_name' => $r->month ?: '—',
                ])
                ->values();
        }

        return response()->json([
            'type' => 'payments',
            'stats' => [
                ['key' => 'collected_amount', 'value' => round($collectedAmount, 2)],
                ['key' => 'payments_count', 'value' => $paymentsCount],
                ['key' => 'unpaid_count', 'value' => $unpaidCount],
                ['key' => 'fees_total', 'value' => round($feesTotal, 2)],
            ],
            'by_grade' => $byFeeType,
            'recent' => $recent,
        ]);
    }

}
