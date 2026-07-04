<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\MonthlyUnpaidStudentsService;
use App\Http\Support\ResolvesTenantApiContext;
use App\Models\Platform\Center;
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

        $this->applyApiLocale($request);

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
        $centers = Center::query();
        $totalCenters = (clone $centers)->count();
        $activeCenters = (clone $centers)->where('status', 1)->count();
        $adminsCount = Schema::hasTable('admins')
            ? DB::table('admins')->count()
            : 0;

        $recentCenters = (clone $centers)
            ->orderByDesc('created_at')
            ->limit(5)
            ->get(['id', 'name', 'slug', 'status', 'created_at'])
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->name,
                    'subtitle' => $row->slug,
                    'status' => ((int) $row->status) === 1 ? 'active' : (((int) $row->status) === 2 ? 'suspended' : 'inactive'),
                    'meta' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            })
            ->values();

        return response()->json([
            'stats' => [
                ['id' => 'centers', 'title' => 'Total Centers', 'value' => (string) $totalCenters, 'icon' => 'globe'],
                ['id' => 'active_centers', 'title' => 'Active Centers', 'value' => (string) $activeCenters, 'icon' => 'users'],
                ['id' => 'platform_admins', 'title' => 'Platform Admins', 'value' => (string) $adminsCount, 'icon' => 'shield'],
                ['id' => 'subscriptions', 'title' => 'Subscriptions', 'value' => (string) $totalCenters, 'icon' => 'credit-card'],
            ],
            'sections' => [
                [
                    'key' => 'recent_centers',
                    'title' => 'Recent Centers',
                    'items' => $recentCenters,
                ],
                [
                    'key' => 'activity',
                    'title' => 'Recent Activity',
                    'items' => $recentCenters->map(function ($center) {
                        return [
                            'id' => $center['id'],
                            'title' => 'Center '.$center['title'].' is '.$center['status'],
                            'meta' => $center['meta'],
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

        $studentsTable = Schema::connection('center')->hasTable('students');
        $teachersTable = Schema::connection('center')->hasTable('teachers');
        $attendanceTable = Schema::connection('center')->hasTable('attendances');
        $announcementsTable = Schema::connection('center')->hasTable('announcements');

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
                ->leftJoin('grades', 'announcements.grade_id', '=', 'grades.id')
                ->leftJoin('classes', 'announcements.class_id', '=', 'classes.id')
                ->leftJoin('sections', 'announcements.section_id', '=', 'sections.id')
                ->whereNull('announcements.deleted_at')
                ->orderByDesc('announcements.created_at')
                ->limit(5)
                ->select(
                    'announcements.id',
                    'announcements.title',
                    'announcements.body',
                    'announcements.created_at',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                )
                ->get()
                ->map(fn ($row) => [
                    'id' => $row->id,
                    'title' => $row->title,
                    'subtitle' => $row->body,
                    'grade_name' => $row->grade_name,
                    'class_name' => $row->class_name,
                    'section_name' => $row->section_name,
                    'meta' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ])->values()
            : collect();

        return response()->json([
            'stats' => [
                ['id' => 'students', 'title' => __('api/dashboard.total_students'), 'value' => (string) $studentsCount, 'variant' => 'students', 'icon' => 'graduation-cap'],
                ['id' => 'teachers', 'title' => __('api/dashboard.teachers'), 'value' => (string) $teachersCount, 'variant' => 'teachers', 'icon' => 'users'],
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
        $teacherId = (int) $teacherId;
        $sectionIds = $this->resolveTeacherSectionIds($tenantDb, $teacherId);
        $locale = app()->getLocale();

        $studentsTable = Schema::connection('center')->hasTable('students');
        $attendanceTable = Schema::connection('center')->hasTable('attendances');
        $homeworksTable = Schema::connection('center')->hasTable('homeworks');
        $examsTable = Schema::connection('center')->hasTable('exam_degrees');
        $quizzesTable = Schema::connection('center')->hasTable('quiz_degrees');

        $sectionCount = $sectionIds->count();

        $studentsCount = 0;
        if ($studentsTable && $sectionIds->isNotEmpty()) {
            $studentsQuery = $tenantDb->table('students')->whereIn('section_id', $sectionIds);
            if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
                $studentsQuery->whereNull('deleted_at');
            }
            $studentsCount = (int) $studentsQuery->count();
        }

        $attendanceRate = 0.0;
        if ($attendanceTable && $sectionIds->isNotEmpty()) {
            $attendanceQuery = $tenantDb->table('attendances')->whereIn('section_id', $sectionIds);
            $totalAttendance = (int) (clone $attendanceQuery)->count();
            if ($totalAttendance > 0) {
                $presentCount = (int) (clone $attendanceQuery)->where('attendance_status', 1)->count();
                $attendanceRate = round(($presentCount / $totalAttendance) * 100, 1);
            }
        }

        $pendingHomework = 0;
        if ($homeworksTable && $sectionIds->isNotEmpty()) {
            $pendingHomework = (int) $tenantDb->table('homeworks')
                ->whereIn('section_id', $sectionIds)
                ->whereDate('due_date', '>=', now()->toDateString())
                ->count();
        }

        $examCount = ($examsTable && $sectionIds->isNotEmpty())
            ? (int) $tenantDb->table('exam_degrees')->whereIn('section_id', $sectionIds)->count()
            : 0;
        $quizCount = ($quizzesTable && $sectionIds->isNotEmpty())
            ? (int) $tenantDb->table('quiz_degrees')->whereIn('section_id', $sectionIds)->count()
            : 0;

        $classItems = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('sections')) {
            $classItems = $tenantDb->table('sections')
                ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
                ->whereIn('sections.id', $sectionIds)
                ->select(
                    'sections.id',
                    'sections.section_name',
                    'classes.class_name',
                    'grades.grade_name'
                )
                ->orderBy('grades.grade_name')
                ->orderBy('classes.class_name')
                ->orderBy('sections.section_name')
                ->get()
                ->map(function ($row) use ($tenantDb, $studentsTable) {
                    $studentsInSection = 0;
                    if ($studentsTable) {
                        $q = $tenantDb->table('students')->where('section_id', $row->id);
                        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
                            $q->whereNull('deleted_at');
                        }
                        $studentsInSection = (int) $q->count();
                    }

                    return [
                        'id' => (int) $row->id,
                        'title' => trim(collect([$row->grade_name, $row->class_name, $row->section_name])->filter()->implode(' · ')),
                        'subtitle' => $row->section_name,
                        'meta' => (string) $studentsInSection,
                    ];
                })
                ->values();
        }

        $attendanceItems = collect();
        if ($attendanceTable && $studentsTable && $sectionIds->isNotEmpty()) {
            $attendanceItems = $tenantDb->table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->whereIn('attendances.section_id', $sectionIds)
                ->orderByDesc('attendances.attendance_date')
                ->limit(6)
                ->get(['attendances.id', 'students.name', 'attendances.attendance_date', 'attendances.attendance_status'])
                ->map(function ($row) use ($locale) {
                    $status = ((int) $row->attendance_status) === 1
                        ? 'present'
                        : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');

                    return [
                        'id' => (int) $row->id,
                        'title' => $row->name ?? 'Student',
                        'meta' => $row->attendance_date
                            ? Carbon::parse($row->attendance_date)->locale($locale)->translatedFormat('M d')
                            : '',
                        'status' => $status,
                    ];
                })
                ->values();
        }

        $homeworkItems = collect();
        if ($homeworksTable && $sectionIds->isNotEmpty()) {
            $homeworkItems = $tenantDb->table('homeworks')
                ->leftJoin('classes', 'homeworks.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'homeworks.grade_id', '=', 'grades.id')
                ->whereIn('homeworks.section_id', $sectionIds)
                ->whereDate('homeworks.due_date', '>=', now()->toDateString())
                ->orderBy('homeworks.due_date')
                ->limit(6)
                ->get(['homeworks.id', 'homeworks.title', 'homeworks.due_date', 'grades.grade_name', 'classes.class_name'])
                ->map(function ($row) use ($locale) {
                    $due = $row->due_date ? Carbon::parse($row->due_date)->locale($locale)->translatedFormat('M d') : '-';

                    return [
                        'id' => (int) $row->id,
                        'title' => $row->title,
                        'subtitle' => trim(collect([$row->grade_name, $row->class_name])->filter()->implode(' · ')),
                        'meta' => __('api/dashboard.teacher_due', ['date' => $due]),
                    ];
                })
                ->values();
        }

        $examItems = collect();
        if ($examsTable && $sectionIds->isNotEmpty()) {
            $examItems = $tenantDb->table('exam_degrees')
                ->leftJoin('students', 'exam_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'exam_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'exam_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'exam_degrees.grade_id', '=', 'grades.id')
                ->whereIn('exam_degrees.section_id', $sectionIds)
                ->orderByDesc('exam_degrees.exam_date')
                ->limit(6)
                ->get([
                    'exam_degrees.id',
                    'exam_degrees.exam_date',
                    'exam_degrees.degree',
                    'students.name as student_name',
                    'grades.grade_name',
                    'classes.class_name',
                    'sections.section_name',
                ])
                ->map(function ($row) use ($locale) {
                    $date = $row->exam_date ? Carbon::parse($row->exam_date)->locale($locale)->translatedFormat('M d') : '-';

                    return [
                        'id' => (int) $row->id,
                        'title' => $row->student_name ?: '-',
                        'subtitle' => trim(collect([$row->grade_name, $row->class_name, $row->section_name])->filter()->implode(' · ')),
                        'meta' => $row->degree !== null
                            ? __('api/dashboard.teacher_degree', ['degree' => $row->degree]).' · '.$date
                            : $date,
                    ];
                })
                ->values();
        }

        $quizItems = collect();
        if ($quizzesTable && $sectionIds->isNotEmpty()) {
            $quizItems = $tenantDb->table('quiz_degrees')
                ->leftJoin('students', 'quiz_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'quiz_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'quiz_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'quiz_degrees.grade_id', '=', 'grades.id')
                ->whereIn('quiz_degrees.section_id', $sectionIds)
                ->orderByDesc('quiz_degrees.quiz_date')
                ->limit(6)
                ->get([
                    'quiz_degrees.id',
                    'quiz_degrees.quiz_date',
                    'quiz_degrees.degree',
                    'students.name as student_name',
                    'grades.grade_name',
                    'classes.class_name',
                    'sections.section_name',
                ])
                ->map(function ($row) use ($locale) {
                    $date = $row->quiz_date ? Carbon::parse($row->quiz_date)->locale($locale)->translatedFormat('M d') : '-';

                    return [
                        'id' => (int) $row->id,
                        'title' => $row->student_name ?: '-',
                        'subtitle' => trim(collect([$row->grade_name, $row->class_name, $row->section_name])->filter()->implode(' · ')),
                        'meta' => $row->degree !== null
                            ? __('api/dashboard.teacher_degree', ['degree' => $row->degree]).' · '.$date
                            : $date,
                    ];
                })
                ->values();
        }

        return response()->json([
            'stats' => [
                ['id' => 'sections', 'title' => __('api/dashboard.teacher_sections'), 'value' => (string) $sectionCount, 'icon' => 'book-open'],
                ['id' => 'students', 'title' => __('api/dashboard.teacher_students'), 'value' => (string) $studentsCount, 'variant' => 'students', 'icon' => 'users'],
                ['id' => 'attendance', 'title' => __('api/dashboard.teacher_attendance'), 'value' => number_format($attendanceRate, 1).'%', 'variant' => 'attendance', 'icon' => 'calendar-check'],
                ['id' => 'homework', 'title' => __('api/dashboard.teacher_homework'), 'value' => (string) $pendingHomework, 'variant' => 'exams', 'icon' => 'clipboard-list'],
                ['id' => 'exams', 'title' => __('api/dashboard.teacher_exams'), 'value' => (string) $examCount, 'variant' => 'default', 'icon' => 'file-text'],
                ['id' => 'quizzes', 'title' => __('api/dashboard.teacher_quizzes'), 'value' => (string) $quizCount, 'variant' => 'default', 'icon' => 'trophy'],
            ],
            'sections' => [
                ['key' => 'my_classes', 'title' => __('api/dashboard.teacher_my_classes'), 'items' => $classItems],
                ['key' => 'recent_attendance', 'title' => __('api/dashboard.teacher_recent_attendance'), 'items' => $attendanceItems],
                ['key' => 'upcoming_homework', 'title' => __('api/dashboard.teacher_upcoming_homework'), 'items' => $homeworkItems],
                ['key' => 'recent_exams', 'title' => __('api/dashboard.teacher_recent_exams'), 'items' => $examItems],
                ['key' => 'recent_quizzes', 'title' => __('api/dashboard.teacher_recent_quizzes'), 'items' => $quizItems],
            ],
        ]);
    }

    /**
     * @return \Illuminate\Support\Collection<int, int>
     */
    private function resolveTeacherSectionIds($tenantDb, int $teacherId): \Illuminate\Support\Collection
    {
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

        return $sectionIds->map(fn ($id) => (int) $id)->unique()->values();
    }

    private function studentDashboard($tenantDb, mixed $studentId): JsonResponse
    {
        $studentsTable = Schema::connection('center')->hasTable('students');
        $attendanceTable = Schema::connection('center')->hasTable('attendances');
        $homeworksTable = Schema::connection('center')->hasTable('homeworks');

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
        $studentsTable = Schema::connection('center')->hasTable('students');
        $attendanceTable = Schema::connection('center')->hasTable('attendances');
        $feesTable = Schema::connection('center')->hasTable('fees');

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
