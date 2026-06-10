<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\MonthlyUnpaidStudentsService;
use App\Http\Support\ResolvesTenantApiContext;
use App\Models\Platform\TenantInfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardApiController extends Controller
{
    use ResolvesTenantApiContext;

    private const TENANT_GUARDS = ['web', 'teacher', 'parent', 'student'];

    private const ROLE_MAP = [
        'web' => 'admin',
        'teacher' => 'teacher',
        'parent' => 'parent',
        'student' => 'student',
        'platform_admin' => 'super_admin',
    ];

    public function __construct(
        private readonly MonthlyUnpaidStudentsService $unpaidStudentsService,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $context = $this->resolveDashboardContext($request, self::TENANT_GUARDS, self::ROLE_MAP);
        if ($context['error']) {
            return $context['error'];
        }

        return match ($context['role']) {
            'super_admin' => $this->superAdminDashboard(),
            'admin' => $this->adminDashboard($request, $context['tenantDb']),
            'teacher' => $this->teacherDashboard($context['tenantDb'], $context['authUser']?->id),
            'student' => $this->studentDashboard($context['tenantDb'], $context['authUser']?->id),
            default => $this->parentDashboard($context['tenantDb'], $context['authUser']?->id),
        };
    }

    private function applyApiLocale(Request $request): string
    {
        $locale = $request->header('X-Locale')
            ?? $request->query('locale')
            ?? $request->header('Accept-Language');

        if (is_string($locale) && str_contains($locale, ',')) {
            $locale = trim(explode(',', $locale)[0]);
        }
        if (is_string($locale) && str_contains($locale, '-')) {
            $locale = explode('-', $locale)[0];
        }

        $locale = is_string($locale) && in_array($locale, ['en', 'ar'], true) ? $locale : 'en';
        app()->setLocale($locale);

        return $locale;
    }

    private function superAdminDashboard(): JsonResponse
    {
        $centralConnection = $this->centralConnection();
        $tenantInfos = TenantInfo::on($centralConnection);
        $totalTenants = (clone $tenantInfos)->count();
        $activeTenants = (clone $tenantInfos)->where('status', 1)->count();
        $adminsCount = Schema::connection($centralConnection)->hasTable('admins')
            ? DB::connection($centralConnection)->table('admins')->count()
            : 0;

        $recentTenants = (clone $tenantInfos)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['tenant_id', 'name', 'subdomain', 'status', 'created_at'])
            ->map(function ($row) {
                return [
                    'id' => $row->tenant_id,
                    'title' => $row->name,
                    'subtitle' => $row->subdomain,
                    'status' => ((int) $row->status) === 1 ? 'active' : (((int) $row->status) === 2 ? 'suspended' : 'inactive'),
                    'meta' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            })
            ->values();

        return response()->json([
            'stats' => [
                ['id' => 'tenants', 'title' => 'Total Tenants', 'value' => (string) $totalTenants, 'icon' => 'globe'],
                ['id' => 'active_tenants', 'title' => 'Active Tenants', 'value' => (string) $activeTenants, 'icon' => 'users'],
                ['id' => 'platform_admins', 'title' => 'Platform Admins', 'value' => (string) $adminsCount, 'icon' => 'shield'],
                ['id' => 'subscriptions', 'title' => 'Subscriptions', 'value' => (string) $totalTenants, 'icon' => 'credit-card'],
            ],
            'sections' => [
                [
                    'key' => 'recent_tenants',
                    'title' => 'Recent Tenants',
                    'items' => $recentTenants,
                ],
                [
                    'key' => 'activity',
                    'title' => 'Recent Activity',
                    'items' => $recentTenants->map(function ($tenant) {
                        return [
                            'id' => $tenant['id'],
                            'title' => 'Tenant '.$tenant['title'].' is '.$tenant['status'],
                            'meta' => $tenant['meta'],
                        ];
                    })->values(),
                ],
            ],
        ]);
    }

    private function adminDashboard(Request $request, $tenantDb): JsonResponse
    {
        $locale = $this->applyApiLocale($request);
        $unpaidFilters = $this->resolveUnpaidFilters($request);
        $reference = $this->resolveReferenceMonth($unpaidFilters['month'] ?? null, $unpaidFilters['year'] ?? null);
        $monthLabel = $reference->locale($locale)->translatedFormat('F Y');

        $studentsTable = Schema::connection('tenant')->hasTable('students');
        $teachersTable = Schema::connection('tenant')->hasTable('teachers');
        $attendanceTable = Schema::connection('tenant')->hasTable('attendances');
        $announcementsTable = Schema::connection('tenant')->hasTable('announcements');

        $studentsCount = $studentsTable ? $tenantDb->table('students')->count() : 0;
        $teachersCount = $teachersTable ? $tenantDb->table('teachers')->count() : 0;
        $attendanceRate = $attendanceTable
            ? (float) $tenantDb->table('attendances')->avg('attendance_status') * 100
            : 0;

        $unpaidSummary = $this->unpaidStudentsService->summarize($tenantDb, $reference, $unpaidFilters);

        $recentStudents = $studentsTable
            ? $tenantDb->table('students')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'name', 'gender', 'created_at'])
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'title' => $row->name,
                    'subtitle' => $row->gender,
                    'meta' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ])->values()
            : collect();

        $announcements = $announcementsTable
            ? $tenantDb->table('announcements')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['id', 'title', 'body', 'created_at'])
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'title' => $row->title,
                    'subtitle' => $row->body,
                    'meta' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ])->values()
            : collect();

        return response()->json([
            'stats' => [
                ['id' => 'students', 'title' => __('api/dashboard.total_students'), 'value' => (string) $studentsCount, 'icon' => 'graduation-cap'],
                ['id' => 'teachers', 'title' => __('api/dashboard.teachers'), 'value' => (string) $teachersCount, 'icon' => 'users'],
                ['id' => 'attendance', 'title' => __('api/dashboard.attendance_rate'), 'value' => number_format($attendanceRate, 1).'%', 'variant' => 'attendance', 'icon' => 'calendar-check'],
                ['id' => 'unpaid_students', 'title' => __('api/dashboard.unpaid_this_month'), 'value' => (string) $unpaidSummary['unpaid_count'], 'variant' => 'alerts', 'icon' => 'dollar-sign'],
                ['id' => 'unpaid_amount', 'title' => __('api/dashboard.unpaid_amount'), 'value' => number_format($unpaidSummary['unpaid_amount'], 2), 'variant' => 'finance', 'icon' => 'dollar-sign'],
            ],
            'sections' => [
                [
                    'key' => 'unpaid_students',
                    'title' => __('api/dashboard.unpaid_students_section', ['month' => $monthLabel]),
                    'items' => $unpaidSummary['items'],
                ],
                ['key' => 'recent_students', 'title' => __('api/dashboard.recent_students'), 'items' => $recentStudents],
                ['key' => 'announcements', 'title' => __('api/dashboard.announcements'), 'items' => $announcements],
            ],
            'payment_summary' => [
                'month' => $monthLabel,
                'expected_students' => $unpaidSummary['expected_students'],
                'paid_count' => $unpaidSummary['paid_count'],
                'unpaid_count' => $unpaidSummary['unpaid_count'],
                'unpaid_amount' => $unpaidSummary['unpaid_amount'],
                'filters' => [
                    'month' => $unpaidFilters['month'] ?? null,
                    'year' => $unpaidFilters['year'] ?? null,
                    'grade_id' => $unpaidFilters['grade_id'] ?? null,
                    'class_id' => $unpaidFilters['class_id'] ?? null,
                    'section_id' => $unpaidFilters['section_id'] ?? null,
                ],
            ],
        ]);
    }

    /**
     * @return array{month?: string, year?: string, grade_id?: int, class_id?: int, section_id?: int}
     */
    private function resolveUnpaidFilters(Request $request): array
    {
        $filters = [];

        $month = $request->query('month');
        if (is_string($month) && trim($month) !== '') {
            $filters['month'] = strtolower(trim($month));
        }

        $year = $request->query('year');
        if (is_numeric($year)) {
            $filters['year'] = (string) (int) $year;
        }

        foreach (['grade_id', 'class_id', 'section_id'] as $key) {
            $value = $request->query($key);
            if (is_numeric($value) && (int) $value > 0) {
                $filters[$key] = (int) $value;
            }
        }

        return $filters;
    }

    private function resolveReferenceMonth(?string $month, ?string $year): Carbon
    {
        $base = now()->copy()->startOfMonth();
        $targetYear = is_numeric($year) ? (int) $year : (int) $base->year;

        if (! $month) {
            return Carbon::create($targetYear, (int) $base->month, 1);
        }

        if (preg_match('/^\d{1,2}$/', $month)) {
            $monthNumber = max(1, min(12, (int) $month));

            return Carbon::create($targetYear, $monthNumber, 1);
        }

        $monthMap = [
            'january' => 1, 'february' => 2, 'march' => 3, 'april' => 4,
            'may' => 5, 'june' => 6, 'july' => 7, 'august' => 8,
            'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12,
            'jan' => 1, 'feb' => 2, 'mar' => 3, 'apr' => 4,
            'jun' => 6, 'jul' => 7, 'aug' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dec' => 12,
        ];

        $normalized = strtolower(trim($month));
        if (isset($monthMap[$normalized])) {
            return Carbon::create($targetYear, $monthMap[$normalized], 1);
        }

        return Carbon::create($targetYear, (int) $base->month, 1);
    }

    private function teacherDashboard($tenantDb, mixed $teacherId): JsonResponse
    {
        $studentsTable = Schema::connection('tenant')->hasTable('students');
        $attendanceTable = Schema::connection('tenant')->hasTable('attendances');
        $homeworksTable = Schema::connection('tenant')->hasTable('homeworks');
        $sectionQuery = Schema::connection('tenant')->hasTable('sections')
            ? $tenantDb->table('sections')
            : null;

        if ($sectionQuery && Schema::connection('tenant')->hasColumn('sections', 'teacher_id')) {
            $classCount = (clone $sectionQuery)->where('teacher_id', $teacherId)->count();
            $scheduleItems = (clone $sectionQuery)
                ->where('teacher_id', $teacherId)
                ->limit(5)
                ->get(['id', 'section_name'])
                ->map(fn ($row) => ['id' => $row->id, 'title' => $row->section_name, 'meta' => '-'])
                ->values();
        } else {
            $classCount = Schema::connection('tenant')->hasTable('classes') ? $tenantDb->table('classes')->count() : 0;
            $scheduleItems = collect();
        }

        $studentsCount = $studentsTable ? $tenantDb->table('students')->count() : 0;
        $attendanceRate = $attendanceTable
            ? (float) $tenantDb->table('attendances')->avg('attendance_status') * 100
            : 0;
        $pendingHomework = $homeworksTable ? $tenantDb->table('homeworks')->whereDate('due_date', '>=', now()->toDateString())->count() : 0;

        $attendanceItems = collect();
        if ($attendanceTable && $studentsTable) {
            $attendanceItems = $tenantDb->table('attendances')
                ->leftJoin('students', 'attendances.student_id', '=', 'students.id')
                ->orderByDesc('attendances.created_at')
                ->limit(5)
                ->get(['attendances.id', 'students.name', 'attendances.attendance_status'])
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'title' => $row->name ?? 'Student',
                    'status' => ((int) $row->attendance_status) === 1 ? 'present' : 'absent',
                ])->values();
        }

        return response()->json([
            'stats' => [
                ['id' => 'classes', 'title' => 'My Classes', 'value' => (string) $classCount, 'icon' => 'book-open'],
                ['id' => 'students', 'title' => 'Total Students', 'value' => (string) $studentsCount, 'icon' => 'users'],
                ['id' => 'attendance', 'title' => 'Avg Attendance', 'value' => number_format($attendanceRate, 1).'%', 'variant' => 'attendance', 'icon' => 'calendar-check'],
                ['id' => 'homework', 'title' => 'Pending Homework', 'value' => (string) $pendingHomework, 'variant' => 'exams', 'icon' => 'clipboard-list'],
            ],
            'sections' => [
                ['key' => 'today_schedule', 'title' => "Today's Schedule", 'items' => $scheduleItems],
                ['key' => 'attendance', 'title' => 'Attendance', 'items' => $attendanceItems],
            ],
        ]);
    }

    private function studentDashboard($tenantDb, mixed $studentId): JsonResponse
    {
        $studentsTable = Schema::connection('tenant')->hasTable('students');
        $attendanceTable = Schema::connection('tenant')->hasTable('attendances');
        $homeworksTable = Schema::connection('tenant')->hasTable('homeworks');

        $studentRow = $studentsTable ? $tenantDb->table('students')->where('id', $studentId)->first() : null;
        $attendanceRate = $attendanceTable && $studentId
            ? (float) $tenantDb->table('attendances')->where('student_id', $studentId)->avg('attendance_status') * 100
            : 0;

        $assignments = collect();
        $pendingHomework = 0;
        if ($homeworksTable) {
            $homeworkQuery = $tenantDb->table('homeworks');
            if ($studentRow) {
                if (! empty($studentRow->grade_id)) {
                    $homeworkQuery->where('grade_id', $studentRow->grade_id);
                }
                if (! empty($studentRow->class_id)) {
                    $homeworkQuery->where('class_id', $studentRow->class_id);
                }
                if (! empty($studentRow->section_id)) {
                    $homeworkQuery->where('section_id', $studentRow->section_id);
                }
            }

            $pendingHomework = (clone $homeworkQuery)->whereDate('due_date', '>=', now()->toDateString())->count();
            $assignments = (clone $homeworkQuery)
                ->orderBy('due_date')
                ->limit(5)
                ->get(['id', 'title', 'due_date'])
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'title' => $row->title,
                    'subtitle' => 'Homework',
                    'meta' => 'Due '.optional($row->due_date)->format('M d'),
                ])->values();
        }

        return response()->json([
            'stats' => [
                ['id' => 'courses', 'title' => 'Enrolled Courses', 'value' => $studentRow ? '1' : '0', 'icon' => 'book-open'],
                ['id' => 'attendance', 'title' => 'Attendance Rate', 'value' => number_format($attendanceRate, 1).'%', 'variant' => 'attendance', 'icon' => 'calendar-check'],
                ['id' => 'gpa', 'title' => 'GPA', 'value' => '-', 'variant' => 'exams', 'icon' => 'trophy'],
                ['id' => 'homework', 'title' => 'Pending Homework', 'value' => (string) $pendingHomework, 'variant' => 'alerts', 'icon' => 'clipboard-list'],
            ],
            'sections' => [
                ['key' => 'assignments', 'title' => 'Upcoming Assignments', 'items' => $assignments],
                ['key' => 'grades', 'title' => 'Recent Grades', 'items' => collect()],
            ],
        ]);
    }

    private function parentDashboard($tenantDb, mixed $parentId): JsonResponse
    {
        $studentsTable = Schema::connection('tenant')->hasTable('students');
        $attendanceTable = Schema::connection('tenant')->hasTable('attendances');
        $feesTable = Schema::connection('tenant')->hasTable('fees');

        $children = $studentsTable
            ? $tenantDb->table('students')->where('parent_id', $parentId)->limit(5)->get(['id', 'name', 'grade_id', 'class_id'])
            : collect();
        $childrenIds = $children->pluck('id')->values();

        $avgAttendance = ($attendanceTable && $childrenIds->isNotEmpty())
            ? (float) $tenantDb->table('attendances')->whereIn('student_id', $childrenIds)->avg('attendance_status') * 100
            : 0;
        $pendingFees = $feesTable ? (float) $tenantDb->table('fees')->sum('amount') : 0;

        return response()->json([
            'stats' => [
                ['id' => 'children', 'title' => 'Children', 'value' => (string) $children->count(), 'icon' => 'users'],
                ['id' => 'attendance', 'title' => 'Avg Attendance', 'value' => number_format($avgAttendance, 1).'%', 'variant' => 'attendance', 'icon' => 'calendar-check'],
                ['id' => 'fees', 'title' => 'Pending Fees', 'value' => '$'.number_format($pendingFees, 0), 'variant' => 'finance', 'icon' => 'dollar-sign'],
                ['id' => 'reports', 'title' => 'Reports', 'value' => (string) $children->count(), 'icon' => 'file-text'],
            ],
            'sections' => [
                [
                    'key' => 'children',
                    'title' => 'Children Overview',
                    'items' => $children->map(fn ($row) => [
                        'id' => $row->id,
                        'title' => $row->name,
                        'subtitle' => 'Grade '.$row->grade_id.' - Class '.$row->class_id,
                        'meta' => 'Attendance '.number_format($avgAttendance, 1).'%',
                    ])->values(),
                ],
                [
                    'key' => 'payments',
                    'title' => 'Recent Payments',
                    'items' => $feesTable
                        ? $tenantDb->table('fees')->orderByDesc('created_at')->limit(5)->get(['id', 'title', 'amount'])->map(fn ($row) => [
                            'id' => $row->id,
                            'title' => $row->title,
                            'subtitle' => '$'.number_format((float) $row->amount, 2),
                            'status' => 'Pending',
                        ])->values()
                        : collect(),
                ],
            ],
        ]);
    }
}