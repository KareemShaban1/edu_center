<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Database\QueryException;
use App\Models\Platform\Center;
use App\Http\Controllers\Platform\PlatformCenterApiController;
use App\Http\Controllers\Platform\PlatformBrandingApiController;
use App\Http\Controllers\Admin\DashboardApiController;
use App\Http\Controllers\Admin\LandingPageApiController;
use App\Http\Controllers\Api\NotificationApiController;
use App\Services\NotificationDispatchService;
use App\Notifications\AnnouncementNotification;
use App\Notifications\ParentAttendanceNotification;
use App\Notifications\StudentAttendanceNotification;
use App\Http\Support\ApiBearerAuth;
use App\Http\Support\AuthLoginHandler;
use App\Http\Support\MultiCenterPortalService;
use App\Http\Support\SectionWeekDays;
use App\Centers\CenterMembershipService;
use App\Models\Parents;
use App\Models\Student;
use App\Centers\CenterContextManager;
use App\Models\Library;
use App\Models\Announcement;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::middleware([
    \App\Http\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \App\Http\Middleware\SyncLegacyCenterSession::class,
    \App\Http\Middleware\RestoreApiSessionFromBearer::class,
])->group(function () {
    $guardMap = [
        'users' => 'web',
        'teacher' => 'teacher',
        'parent' => 'parent',
        'student' => 'student',
        'super_admin' => 'platform_admin',
        'platform_admin' => 'platform_admin',
        'admin' => 'web',
    ];

    $roleMap = [
        'web' => 'admin',
        'teacher' => 'teacher',
        'parent' => 'parent',
        'student' => 'student',
        'platform_admin' => 'super_admin',
    ];

    $tenantGuards = ['web', 'teacher', 'parent', 'student'];

    /** @var CenterContextManager $centerContext */
    $centerContext = app(CenterContextManager::class);
    $centralConnection = config('database.default', 'mysql');

    $resolveTenantBySlug = fn (?string $slug): ?Center => $centerContext->resolveBySlug($slug);

    $resolveTenant = fn (mixed $tenantId, mixed $tenantSlug): ?Center => $centerContext->resolve(
        $tenantId,
        is_string($tenantSlug) ? $tenantSlug : null
    );

    $ensureTenantInitialized = function (?Center $center) use ($centerContext): void {
        $centerContext->initialize($center);
    };

    Route::get('/config', function () {
        return response()->json([
            'storage_mode' => 'central_database',
            'center_table' => 'centers',
            // Backward-compatible aliases
            'tenancy_mode' => 'central_shared',
        ]);
    });

    Route::get('/branding', [PlatformBrandingApiController::class, 'show']);

    Route::get('/auth/guards', function () {
        return response()->json([
            'guards' => ['users', 'teacher', 'parent', 'student', 'super_admin'],
        ]);
    });

    Route::get('/admin/bootstrap', function (Request $request) use ($tenantGuards, $resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');

        if (!in_array($guard, $tenantGuards, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

        $tenantDb = DB::connection('center');
        $studentsHasIsActive = Schema::connection('center')->hasColumn('students', 'is_active');
        $teachersHasIsActive = Schema::connection('center')->hasColumn('teachers', 'is_active');
        $parentsHasIsActive = Schema::connection('center')->hasColumn('parents', 'is_active');

        $grades = $tenantDb->table('grades')
            ->select('id', 'grade_name as name', 'notes')
            ->get();

        $classes = $tenantDb->table('classes')
            ->select('id', 'class_name as name', 'grade_id', DB::raw('NULL as notes'))
            ->get();

        $sectionHasTeacherId = Schema::connection('center')->hasColumn('sections', 'teacher_id');
        $sectionHasWeekDays = Schema::connection('center')->hasColumn('sections', 'week_days');
        $sections = $tenantDb->table('sections')
            ->select(
                'id',
                'section_name as name',
                'class_id',
                'grade_id',
                $sectionHasTeacherId ? 'teacher_id' : DB::raw('NULL as teacher_id'),
                $sectionHasWeekDays ? 'week_days' : DB::raw('NULL as week_days'),
            )
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'class_id' => $row->class_id,
                    'grade_id' => $row->grade_id,
                    'teacher_id' => $row->teacher_id,
                    'week_days' => SectionWeekDays::decode($row->week_days ?? null),
                ];
            });

        $studentSelect = [
            'students.id',
            'students.code',
            'students.name',
            'students.email',
            'students.gender',
            'students.grade_id',
            'students.class_id',
            'students.section_id',
            'students.parent_id',
            'students.created_at',
            'grades.grade_name as grade_name',
            'classes.class_name as class_name',
            'sections.section_name as section_name',
        ];
        if ($studentsHasIsActive) {
            $studentSelect[] = 'students.is_active';
        }

        $studentsQuery = $tenantDb->table('students')
            ->leftJoin('grades', 'students.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'students.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'students.section_id', '=', 'sections.id');

        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $studentsQuery->whereNull('students.deleted_at');
        }

        $students = $studentsQuery
            ->select($studentSelect)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'code' => $row->code ?? '',
                    'name' => $row->name,
                    'email' => $row->email,
                    'gender' => $row->gender,
                    'status' => isset($row->is_active) ? ((int) $row->is_active === 1 ? 'active' : 'inactive') : 'active',
                    'grade_id' => $row->grade_id,
                    'classroom_id' => $row->class_id,
                    'section_id' => $row->section_id,
                    'grade_name' => $row->grade_name ?: '',
                    'class_name' => $row->class_name ?: '',
                    'section_name' => $row->section_name ?: '',
                    'parent_id' => $row->parent_id,
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            });

        $teacherColumns = ['id', 'name', 'email', 'subject as specialization', 'phone', 'gender', 'joining_date'];
        if ($teachersHasIsActive) {
            $teacherColumns[] = 'is_active';
        }
        $teachers = $tenantDb->table('teachers')
            ->select($teacherColumns)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'specialization' => $row->specialization,
                    'phone' => $row->phone,
                    'gender' => $row->gender,
                    'status' => isset($row->is_active) ? ((int) $row->is_active === 1 ? 'active' : 'inactive') : 'active',
                    'joining_date' => $row->joining_date,
                    'class_ids' => [],
                ];
            });

        if (Schema::connection('center')->hasTable('teacher_section') && Schema::connection('center')->hasTable('sections')) {
            $teacherClassRows = $tenantDb->table('teacher_section')
                ->join('sections', 'teacher_section.section_id', '=', 'sections.id')
                ->select('teacher_section.teacher_id', 'sections.class_id')
                ->get()
                ->groupBy('teacher_id')
                ->map(function ($rows) {
                    return $rows
                        ->pluck('class_id')
                        ->filter()
                        ->unique()
                        ->map(fn ($id) => (int) $id)
                        ->values()
                        ->all();
                });

            $teachers = $teachers->map(function ($teacher) use ($teacherClassRows) {
                $teacher['class_ids'] = $teacherClassRows->get($teacher['id'], []);
                return $teacher;
            });

            if (!$sectionHasTeacherId) {
                $sectionTeacherRows = $tenantDb->table('teacher_section')
                    ->select('section_id', DB::raw('MIN(teacher_id) as teacher_id'))
                    ->groupBy('section_id')
                    ->get()
                    ->keyBy('section_id');
                $sections = $sections->map(function ($section) use ($sectionTeacherRows) {
                    $teacherRow = $sectionTeacherRows->get($section['id']);
                    $section['teacher_id'] = $teacherRow ? (int) $teacherRow->teacher_id : null;

                    return $section;
                });
            }
        }

        $parentColumns = ['id', 'parent_name', 'email', 'parent_phone', 'parent_job', 'parent_address', 'created_at'];
        if ($parentsHasIsActive) {
            $parentColumns[] = 'is_active';
        }
        $parents = $tenantDb->table('parents')
            ->select($parentColumns)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->parent_name,
                    'email' => $row->email,
                    'phone' => $row->parent_phone,
                    'job_title' => $row->parent_job,
                    'address' => $row->parent_address,
                    'status' => isset($row->is_active) ? ((int) $row->is_active === 1 ? 'active' : 'inactive') : 'active',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            });

        $attendances = $tenantDb->table('attendances')
            ->select('id', 'student_id', 'attendance_date as date', 'attendance_status as status')
            ->get();

        $feesHasFeeType = Schema::connection('center')->hasColumn('fees', 'fee_type');
        $feesHasLegacyType = Schema::connection('center')->hasColumn('fees', 'Fee_type');
        $feeTypeSelect = $feesHasFeeType
            ? 'fee_type as type'
            : ($feesHasLegacyType ? 'Fee_type as type' : DB::raw("'monthly' as type"));
        $fees = $tenantDb->table('fees')
            ->select(
                'id',
                'title',
                'amount',
                'grade_id',
                'class_id as classroom_id',
                'section_id',
                'description',
                'year',
                'month',
                $feeTypeSelect
            )
            ->get();

        $units = $tenantDb->table('units')
            ->select('id', 'name', 'class_id', 'notes')
            ->get();

        $lessons = $tenantDb->table('lessons')
            ->select('id', 'name', 'unit_id', 'notes')
            ->get();

        $homeworks = $tenantDb->table('homeworks')
            ->select('id', 'title', 'content', 'grade_id', 'class_id', 'section_id', 'submit_date as start_date', 'due_date')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'content' => $row->content,
                    'grade_id' => $row->grade_id,
                    'classroom_id' => $row->class_id,
                    'section_id' => $row->section_id,
                    'start_date' => $row->start_date,
                    'due_date' => $row->due_date,
                ];
            });

        $library = $tenantDb->table('library')
            ->select('id', 'title', DB::raw('NULL as description'), DB::raw('NULL as file'), 'created_at')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'description' => $row->description,
                    'file' => $row->file,
                    'type' => 'file',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            });

        $announcements = $tenantDb->table('announcements')
            ->select('id', 'title', 'body as content', 'created_at')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'content' => $row->content,
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            });

        $users = $tenantDb->table('users')
            ->select('id', 'name', 'email', 'created_at')
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'role' => 'admin',
                    'status' => 'active',
                    'tenant_name' => 'Tenant',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                ];
            });

        $roles = collect();
        if (Schema::connection('center')->hasTable('roles') && Schema::connection('center')->hasTable('model_has_roles')) {
            $roles = $tenantDb->table('roles')
                ->leftJoin('model_has_roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->select('roles.id', 'roles.name', 'roles.guard_name', DB::raw('COUNT(model_has_roles.model_id) as users_count'))
                ->groupBy('roles.id', 'roles.name', 'roles.guard_name')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => $row->id,
                        'name' => $row->name,
                        'guard' => $row->guard_name,
                        'permissions' => 0,
                        'users' => (int) $row->users_count,
                    ];
                });
        }

        return response()->json([
            'tenant' => [
                'id' => $tenant->id,
                'slug' => $tenant->slug ?? $tenantSlug,
                'name' => $tenant->name,
            ],
            'center' => [
                'id' => $tenant->id,
                'slug' => $tenant->slug ?? $tenantSlug,
                'name' => $tenant->name,
            ],
            'grades' => $grades,
            'classes' => $classes,
            'sections' => $sections,
            'students' => $students,
            'teachers' => $teachers,
            'parents' => $parents,
            'attendance' => $attendances,
            'fees' => $fees,
            'units' => $units,
            'lessons' => $lessons,
            'homework' => $homeworks,
            'library' => $library,
            'announcements' => $announcements,
            'users' => $users,
            'roles' => $roles,
            'reports' => [
                'students' => $students->count(),
                'teachers' => $teachers->count(),
                'parents' => $parents->count(),
                'attendance' => $attendances->count(),
            ],
        ]);
    });

    Route::get('/teacher/bootstrap', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

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

        $classes = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('sections')) {
            $classes = $tenantDb->table('sections')
                ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
                ->whereIn('sections.id', $sectionIds)
                ->select(
                    'sections.id',
                    'sections.section_name as section_name',
                    'classes.class_name as class_name',
                    'grades.grade_name as grade_name',
                    'sections.class_id',
                    'sections.grade_id'
                )
                ->orderBy('grades.grade_name')
                ->orderBy('classes.class_name')
                ->orderBy('sections.section_name')
                ->get()
                ->map(function ($row) use ($tenantDb) {
                    $studentsList = collect();
                    $studentsCount = 0;
                    if (Schema::connection('center')->hasTable('students')) {
                        $studentsQuery = $tenantDb->table('students')->where('section_id', $row->id)->select('id', 'name');
                        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
                            $studentsQuery->whereNull('deleted_at');
                        }
                        $studentsList = $studentsQuery->orderBy('name')->get()->map(fn ($s) => [
                            'id' => (int) $s->id,
                            'name' => $s->name,
                        ])->values();
                        $studentsCount = (int) $studentsList->count();
                    }
                    return [
                        'id' => (int) $row->id,
                        'name' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? 'Section')),
                        'grade' => $row->grade_name ?? '',
                        'class' => $row->class_name ?? '',
                        'section' => $row->section_name ?? '',
                        'students' => $studentsCount,
                        'students_list' => $studentsList,
                        'schedule' => '',
                    ];
                })
                ->values();
        }

        $attendance = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('attendances') && Schema::connection('center')->hasTable('students')) {
            $attendance = $tenantDb->table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->whereIn('students.section_id', $sectionIds)
                ->orderByDesc('attendances.attendance_date')
                ->limit(300)
                ->get(['attendances.id', 'attendances.student_id', 'attendances.attendance_date', 'attendances.attendance_status', 'students.name'])
                ->map(function ($row) {
                    $status = ((int) $row->attendance_status) === 1 ? 'present' : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'date' => $row->attendance_date,
                        'status' => $status,
                        'student' => ['name' => $row->name],
                    ];
                })
                ->values();
        }

        $quizzes = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('quiz_degrees')) {
            $quizzes = $tenantDb->table('quiz_degrees')
                ->leftJoin('students', 'quiz_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'quiz_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'quiz_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'quiz_degrees.grade_id', '=', 'grades.id')
                ->whereIn('quiz_degrees.section_id', $sectionIds)
                ->select('quiz_degrees.id', 'quiz_degrees.quiz_date', 'quiz_degrees.degree', 'quiz_degrees.notes', 'quiz_degrees.attendance_status', 'students.name as student_name', 'grades.grade_name as grade_name', 'classes.class_name as class_name', 'sections.section_name as section_name')
                ->orderByDesc('quiz_degrees.quiz_date')
                ->limit(200)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => 'Quiz ' . $row->quiz_date,
                        'subject' => 'General',
                        'grade' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? '')),
                        'date' => $row->quiz_date,
                        'student_name' => $row->student_name ?? '',
                        'degree' => $row->degree !== null ? (float) $row->degree : null,
                        'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                        'notes' => $row->notes ?? '',
                        'status' => $row->degree !== null ? 'completed' : 'pending',
                    ];
                })
                ->values();
        }

        $exams = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('exam_degrees')) {
            $exams = $tenantDb->table('exam_degrees')
                ->leftJoin('students', 'exam_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'exam_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'exam_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'exam_degrees.grade_id', '=', 'grades.id')
                ->whereIn('exam_degrees.section_id', $sectionIds)
                ->select('exam_degrees.id', 'exam_degrees.exam_date', 'exam_degrees.degree', 'exam_degrees.notes', 'exam_degrees.attendance_status', 'students.name as student_name', 'grades.grade_name as grade_name', 'classes.class_name as class_name', 'sections.section_name as section_name')
                ->orderByDesc('exam_degrees.exam_date')
                ->limit(200)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => 'Exam ' . $row->exam_date,
                        'subject' => 'General',
                        'grade' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? '')),
                        'date' => $row->exam_date,
                        'student_name' => $row->student_name ?? '',
                        'degree' => $row->degree !== null ? (float) $row->degree : null,
                        'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                        'notes' => $row->notes ?? '',
                        'status' => $row->degree !== null ? 'completed' : 'pending',
                    ];
                })
                ->values();
        }

        $homework = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('homeworks')) {
            $homework = $tenantDb->table('homeworks')
                ->leftJoin('classes', 'homeworks.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'homeworks.grade_id', '=', 'grades.id')
                ->whereIn('homeworks.section_id', $sectionIds)
                ->orderByDesc('homeworks.due_date')
                ->limit(200)
                ->get(['homeworks.id', 'homeworks.title', 'homeworks.due_date', 'grades.grade_name as grade_name', 'classes.class_name as class_name'])
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'title' => $row->title,
                        'subject' => 'General',
                        'grade' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '')),
                        'due_date' => $row->due_date,
                        'submissions' => 0,
                    ];
                })
                ->values();
        }

        $library = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('library')) {
            $library = $tenantDb->table('library')
                ->leftJoin('grades', 'library.grade_id', '=', 'grades.id')
                ->whereIn('library.section_id', $sectionIds)
                ->whereNull('library.deleted_at')
                ->orderByDesc('library.id')
                ->limit(200)
                ->get(['library.id', 'library.title', 'library.type', 'grades.grade_name as grade_name'])
                ->map(function ($row) {
                    $book = Library::query()->find($row->id);
                    $firstMediaUrl = $book?->getFirstMediaUrl('library') ?: null;
                    return [
                        'id' => (int) $row->id,
                        'title' => $row->title,
                        'type' => $row->type ?: 'resource',
                        'grade' => $row->grade_name ?: '',
                        'url' => $firstMediaUrl,
                    ];
                })
                ->values();
        }

        return response()->json([
            'classes' => $classes,
            'attendance' => $attendance,
            'exams' => $exams,
            'quizzes' => $quizzes,
            'homework' => $homework,
            'library' => $library,
        ]);
    });

    Route::get('/teacher/meeting-series', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $teacherEmail = null;
        if (Schema::connection('center')->hasTable('teachers')) {
            $teacherRow = $tenantDb->table('teachers')->where('id', $teacherId)->first();
            $teacherEmail = $teacherRow->email ?? null;
        }

        if (!$teacherEmail) {
            return response()->json(['message' => 'Teacher email not found'], 422);
        }

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

        $sections = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('sections')) {
            $sections = $tenantDb->table('sections')
                ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
                ->whereIn('sections.id', $sectionIds)
                ->select(
                    'sections.id',
                    'sections.section_name as section_name',
                    'classes.class_name as class_name',
                    'grades.grade_name as grade_name'
                )
                ->orderBy('grades.grade_name')
                ->orderBy('classes.class_name')
                ->orderBy('sections.section_name')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? 'Section')),
                    ];
                })
                ->values();
        }

        // Generate upcoming occurrences (idempotent).
        \App\Services\MeetingSeriesGenerator::generateForTeacherSeries(
            $teacherEmail,
            now()->subDay(),
            now()->addDays(30)
        );

        $series = \App\Models\MeetingSeries::query()
            ->where('created_by', $teacherEmail)
            ->orderByDesc('start_date')
            ->get();

        $series = $series->map(function ($s) use ($tenantDb) {
            $occ = \App\Models\Meeting::query()
                ->where('series_id', (int) $s->id)
                ->where('start_at', '>=', now()->subDay())
                ->where('start_at', '<=', now()->addDays(30))
                ->orderBy('start_at')
                ->limit(8)
                ->get([
                    'id',
                    'topic',
                    'start_at',
                    'duration',
                    'provider',
                    'room_slug',
                    'join_url',
                    'moderator_url',
                    'location',
                    'notes',
                    'external_ref',
                ])
                ->map(function ($m) {
                    $duration = (int) ($m->duration ?? 0);
                    $isOver = \Carbon\Carbon::parse((string) $m->start_at)
                        ->addMinutes($duration)
                        ->lt(now());

                    return [
                        'id' => (int) $m->id,
                        'topic' => $m->topic,
                        'start_at' => (string) $m->start_at,
                        'duration' => $duration,
                        'provider' => $m->provider ?? 'jitsi',
                        'room_slug' => $m->room_slug ?? '',
                        'join_url' => $m->join_url ?? '',
                        'moderator_url' => $m->moderator_url ?? '',
                        'location' => $m->location ?? '',
                        'notes' => $m->notes ?? '',
                        'external_ref' => $m->external_ref ?? '',
                        'is_over' => $isOver,
                    ];
                })
                ->values();
            $nextStartable = $occ->first(function ($o) {
                return !(bool) ($o['is_over'] ?? false);
            });

            return [
                'id' => (int) $s->id,
                'topic' => $s->topic,
                'provider' => $s->provider ?? 'offline',
                'week_days' => is_array($s->week_days) ? array_values($s->week_days) : [],
                'start_date' => (string) $s->start_date,
                'end_date' => $s->end_date ? (string) $s->end_date : null,
                'start_time' => (string) $s->start_time,
                'duration' => (int) ($s->duration ?? 0),
                'record_enabled' => (bool) ($s->record_enabled ?? false),
                'location' => $s->location ?? '',
                'notes' => $s->notes ?? '',
                'join_url' => $s->join_url ?? '',
                'moderator_url' => $s->moderator_url ?? '',
                'external_ref' => $s->external_ref ?? null,
                'next_occurrences' => $occ,
                'next_startable_occurrence' => $nextStartable,
            ];
        })->values();

        return response()->json([
            'series' => $series,
            'sections' => $sections,
        ]);
    });

    Route::post('/teacher/meeting-series', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $teacherRow = Schema::connection('center')->hasTable('teachers')
            ? $tenantDb->table('teachers')->where('id', $teacherId)->first()
            : null;
        $teacherEmail = $teacherRow?->email ?? null;
        if (!$teacherEmail) {
            return response()->json(['message' => 'Teacher email not found'], 422);
        }

        $payload = $request->validate([
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'in:jitsi,livekit,zoom,microsoft_teams,google_meet,external,offline'],

            'week_days' => ['required', 'array', 'min:1', 'max:7'],
            'week_days.*' => ['integer', 'min:1', 'max:7'],

            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],

            'record_enabled' => ['nullable', 'boolean'],
            'generate_value' => ['nullable', 'integer', 'min:1', 'max:24'],
            'generate_unit' => ['nullable', 'in:weeks,months'],

            'join_url' => ['nullable', 'string', 'max:2000'],
            'moderator_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'max:255'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $section = null;
        if (Schema::connection('center')->hasTable('sections')) {
            $section = $tenantDb->table('sections')->where('id', (int) $payload['section_id'])->first();
        }
        if (!$section) {
            return response()->json(['message' => 'Section not found'], 404);
        }

        // Authorization: ensure section belongs to this teacher.
        $allowed = false;
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
        if ($sectionIds->isNotEmpty()) {
            $allowed = $sectionIds->contains((int) $payload['section_id']);
        }
        if (!$allowed) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $provider = (string) $payload['provider'];
        if (in_array($provider, ['external', 'zoom', 'microsoft_teams', 'google_meet'], true)) {
            if (empty($payload['join_url'])) {
                return response()->json(['message' => 'join_url is required for this provider'], 422);
            }
        }
        if ($provider === 'offline') {
            if (empty($payload['location'])) {
                return response()->json(['message' => 'location is required for offline provider'], 422);
            }
        }

        $seriesPayload = [
            'created_by' => $teacherEmail,
            'grade_id' => (int) ($section->grade_id ?? 0),
            'class_id' => (int) ($section->class_id ?? 0),
            'section_id' => (int) $payload['section_id'],
            'topic' => $payload['topic'],
            'provider' => $provider,
            'week_days' => array_values($payload['week_days']),
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'] ?? null,
            'start_time' => $payload['start_time'],
            'duration' => (int) $payload['duration'],
            'record_enabled' => (bool) ($payload['record_enabled'] ?? false),
            'join_url' => $payload['join_url'] ?? null,
            'moderator_url' => $payload['moderator_url'] ?? null,
            'password' => $payload['password'] ?? null,
            'external_ref' => $payload['external_ref'] ?? null,
            'location' => $payload['location'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ];
        if (Schema::connection('center')->hasColumn('meeting_series', 'teacher_id')) {
            $seriesPayload['teacher_id'] = $teacherId;
        }
        if (Schema::connection('center')->hasColumn('meeting_series', 'status')) {
            $seriesPayload['status'] = 'started';
        }
        $series = \App\Models\MeetingSeries::create($seriesPayload);

        $generateValue = (int) ($payload['generate_value'] ?? 8);
        $generateUnit = (string) ($payload['generate_unit'] ?? 'weeks');
        $generateTo = now();
        if ($generateUnit === 'months') {
            $generateTo = $generateTo->addMonths($generateValue);
        } else {
            $generateTo = $generateTo->addWeeks($generateValue);
        }

        \App\Services\MeetingSeriesGenerator::generateForSeries(
            $series,
            now()->subDay(),
            $generateTo
        );

        return response()->json(['ok' => true]);
    });

    Route::delete('/teacher/meeting-series/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Auth::guard('teacher')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherId = (int) Auth::guard('teacher')->id();
        $tenantDb = DB::connection('center');

        $teacherRow = Schema::connection('center')->hasTable('teachers')
            ? $tenantDb->table('teachers')->where('id', $teacherId)->first()
            : null;
        $teacherEmail = $teacherRow?->email ?? null;
        if (!$teacherEmail) {
            return response()->json(['message' => 'Teacher email not found'], 422);
        }

        $series = \App\Models\MeetingSeries::query()
            ->where('id', $id)
            ->where('created_by', $teacherEmail)
            ->first();

        if (!$series) {
            return response()->json(['message' => 'Not found'], 404);
        }

        \App\Models\Meeting::query()->where('series_id', (int) $series->id)->delete();
        $series->delete();

        return response()->json(['ok' => true]);
    });

    Route::get('/teacher/meetings/{id}/livekit-token', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

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
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        $row = $tenantDb->table('meetings')
            ->where('id', $id)
            ->whereIn('section_id', $sectionIds)
            ->first();

        if (!$row || ($row->provider ?? '') !== 'livekit' || empty($row->room_slug)) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }

        $token = \App\Services\LiveKitAccessTokenService::createToken(
            (string) $row->room_slug,
            'teacher-'.$teacherId,
            true,
            (bool) ($row->record_enabled ?? false)
        );

        return response()->json([
            'token' => $token,
            'url' => config('meetings.livekit.url'),
            'room' => $row->room_slug,
        ]);
    });

    Route::get('/teacher/meetings', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

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

        if (!Schema::connection('center')->hasTable('meetings') || $sectionIds->isEmpty()) {
            return response()->json(['meetings' => [], 'series_options' => []]);
        }

        $hasSeriesCol = Schema::connection('center')->hasColumn('meetings', 'series_id');
        $hasLocationCol = Schema::connection('center')->hasColumn('meetings', 'location');

        $rows = $tenantDb->table('meetings')
            ->leftJoin('sections', 'meetings.section_id', '=', 'sections.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->whereIn('meetings.section_id', $sectionIds)
            ->select(
                'meetings.id',
                'meetings.grade_id',
                'meetings.class_id',
                'meetings.section_id',
                'meetings.topic',
                'meetings.start_at',
                'meetings.duration',
                'meetings.provider',
                'meetings.room_slug',
                'meetings.join_url',
                'meetings.moderator_url',
                'meetings.password',
                'meetings.record_enabled',
                'meetings.external_ref',
                'meetings.created_by',
                DB::raw("trim(concat_ws(' - ', nullif(grades.grade_name, ''), nullif(classes.class_name, ''), nullif(sections.section_name, ''))) as section_label")
            );

        if ($hasSeriesCol) {
            $rows->addSelect('meetings.series_id');
        }
        if ($hasLocationCol) {
            $rows->addSelect('meetings.location', 'meetings.notes');
        }

        $meetings = $rows->orderByDesc('meetings.start_at')->get()->map(function ($row) use ($hasSeriesCol, $hasLocationCol) {
            $m = [
                'id' => (int) $row->id,
                'grade_id' => (int) $row->grade_id,
                'class_id' => (int) $row->class_id,
                'section_id' => (int) $row->section_id,
                'section_label' => (string) ($row->section_label ?? ''),
                'topic' => (string) $row->topic,
                'start_at' => $row->start_at ? (string) $row->start_at : '',
                'duration' => (int) $row->duration,
                'provider' => (string) ($row->provider ?? 'jitsi'),
                'room_slug' => $row->room_slug ?? null,
                'join_url' => $row->join_url ?? null,
                'moderator_url' => $row->moderator_url ?? null,
                'password' => $row->password ?? null,
                'record_enabled' => (bool) ($row->record_enabled ?? false),
                'external_ref' => $row->external_ref ?? null,
                'created_by' => (string) ($row->created_by ?? ''),
            ];
            if ($hasSeriesCol) {
                $m['series_id'] = isset($row->series_id) && $row->series_id !== null ? (int) $row->series_id : null;
            }
            if ($hasLocationCol) {
                $m['location'] = $row->location ?? '';
                $m['notes'] = $row->notes ?? '';
            }

            return $m;
        })->values();

        $seriesOptions = collect();
        if (Schema::connection('center')->hasTable('meeting_series')) {
            $seriesOptions = $tenantDb->table('meeting_series')
                ->whereIn('section_id', $sectionIds)
                ->orderBy('topic')
                ->get(['id', 'topic', 'section_id'])
                ->map(fn ($s) => [
                    'id' => (int) $s->id,
                    'topic' => (string) $s->topic,
                    'section_id' => (int) $s->section_id,
                ])
                ->values();
        }

        return response()->json([
            'meetings' => $meetings,
            'series_options' => $seriesOptions,
        ]);
    });

    Route::put('/teacher/meetings/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

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

        if (!Schema::connection('center')->hasTable('meetings') || $sectionIds->isEmpty()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $hasSeriesCol = Schema::connection('center')->hasColumn('meetings', 'series_id');
        $hasLocationCol = Schema::connection('center')->hasColumn('meetings', 'location');

        $existing = $tenantDb->table('meetings')->where('id', $id)->first();
        if (!$existing || !$sectionIds->contains((int) ($existing->section_id ?? 0))) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $payload = $request->validate([
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],
            'provider' => ['required', 'in:jitsi,livekit,external,offline,zoom,microsoft_teams,google_meet'],
            'series_id' => ['nullable', 'integer'],
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

        $provider = (string) $payload['provider'];
        $urlProviders = ['external', 'zoom', 'microsoft_teams', 'google_meet'];
        if (in_array($provider, $urlProviders, true) && empty($payload['join_url'])) {
            return response()->json(['message' => 'join_url is required for this provider'], 422);
        }
        if ($provider === 'offline' && empty($payload['location'])) {
            return response()->json(['message' => 'location is required for offline provider'], 422);
        }

        $seriesId = isset($payload['series_id']) ? (int) $payload['series_id'] : null;
        if ($hasSeriesCol && $seriesId) {
            $seriesRow = $tenantDb->table('meeting_series')->where('id', $seriesId)->first();
            if (!$seriesRow) {
                return response()->json(['message' => 'Meeting series not found'], 404);
            }
            if ((int) ($seriesRow->section_id ?? 0) !== $sectionId) {
                return response()->json(['message' => 'series_id does not belong to this section'], 422);
            }
        } elseif ($seriesId) {
            $seriesId = null;
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
            'provider' => $provider,
            'updated_at' => now(),
        ];
        if ($hasLocationCol) {
            $update['location'] = $payload['location'] ?? null;
            $update['notes'] = $payload['notes'] ?? null;
        }
        if ($hasSeriesCol) {
            $update['series_id'] = $seriesId ?: null;
        }

        if ($provider === 'offline') {
            $update['room_slug'] = null;
            $update['join_url'] = '#';
            $update['moderator_url'] = null;
            $update['external_ref'] = null;
            $update['password'] = null;
        } elseif ($provider === 'jitsi') {
            if (($existing->provider ?? '') !== 'jitsi' || empty($existing->room_slug)) {
                $links = \App\Services\MeetingLinkService::forJitsi();
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
                $slug = \App\Services\MeetingLinkService::generateRoomSlug();
                $links = \App\Services\MeetingLinkService::forLiveKit($slug);
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
            $tenantDb->table('meetings')->where('id', $id)->update($update);
        } catch (QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                return response()->json(['message' => 'A meeting with this series and start time already exists.'], 422);
            }
            throw $e;
        }

        return response()->json(['ok' => true]);
    });

    Route::delete('/teacher/meetings/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

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

        if (!Schema::connection('center')->hasTable('meetings') || $sectionIds->isEmpty()) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $deleted = $tenantDb->table('meetings')
            ->where('id', $id)
            ->whereIn('section_id', $sectionIds)
            ->delete();
        if (!$deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['ok' => true]);
    });

    Route::get('/admin/meeting-series', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        $tenantDb = DB::connection('center');
        if (!Schema::connection('center')->hasTable('meeting_series')) {
            return response()->json(['series' => [], 'teachers' => [], 'sections_by_teacher' => new \stdClass()]);
        }

        $teachers = collect();
        if (Schema::connection('center')->hasTable('teachers')) {
            $teachers = $tenantDb->table('teachers')
                ->orderBy('name')
                ->get(['id', 'name', 'email'])
                ->map(fn ($t) => [
                    'id' => (int) $t->id,
                    'name' => (string) $t->name,
                    'email' => (string) ($t->email ?? ''),
                ])
                ->values();
        }

        $sectionsByTeacher = [];
        foreach ($teachers as $teacher) {
            $sectionIds = collect();
            if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
                $sectionIds = $sectionIds->merge(
                    $tenantDb->table('sections')->where('teacher_id', (int) $teacher['id'])->pluck('id')
                );
            }
            if (Schema::connection('center')->hasTable('teacher_section')) {
                $sectionIds = $sectionIds->merge(
                    $tenantDb->table('teacher_section')->where('teacher_id', (int) $teacher['id'])->pluck('section_id')
                );
            }
            $sectionIds = $sectionIds->unique()->values();

            $sections = collect();
            if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('sections')) {
                $sections = $tenantDb->table('sections')
                    ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
                    ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
                    ->whereIn('sections.id', $sectionIds)
                    ->select(
                        'sections.id',
                        'sections.section_name as section_name',
                        'classes.class_name as class_name',
                        'grades.grade_name as grade_name'
                    )
                    ->orderBy('grades.grade_name')
                    ->orderBy('classes.class_name')
                    ->orderBy('sections.section_name')
                    ->get()
                    ->map(function ($row) {
                        return [
                            'id' => (int) $row->id,
                            'name' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? 'Section')),
                        ];
                    })
                    ->values();
            }
            $sectionsByTeacher[(string) $teacher['id']] = $sections;
        }

        $series = \App\Models\MeetingSeries::query()
            ->orderByDesc('start_date')
            ->get()
            ->map(function ($s) use ($teachers, $sectionsByTeacher) {
                $teacher = $teachers->first(fn ($t) => ($t['email'] ?? '') === ($s->created_by ?? ''));
                $teacherId = (int) ($teacher['id'] ?? 0);
                $sectionName = collect($sectionsByTeacher[(string) $teacherId] ?? [])->firstWhere('id', (int) $s->section_id)['name'] ?? ('Section '.$s->section_id);
                return [
                    'id' => (int) $s->id,
                    'topic' => (string) $s->topic,
                    'provider' => (string) ($s->provider ?? 'offline'),
                    'teacher_id' => $teacherId,
                    'teacher_name' => (string) ($teacher['name'] ?? 'Teacher'),
                    'section_id' => (int) $s->section_id,
                    'section_name' => (string) $sectionName,
                    'week_days' => is_array($s->week_days) ? array_values($s->week_days) : [],
                    'start_date' => (string) $s->start_date,
                    'end_date' => $s->end_date ? (string) $s->end_date : null,
                    'start_time' => (string) $s->start_time,
                    'duration' => (int) ($s->duration ?? 0),
                    'record_enabled' => (bool) ($s->record_enabled ?? false),
                    'location' => $s->location ?? '',
                    'notes' => $s->notes ?? '',
                ];
            })
            ->values();

        return response()->json([
            'series' => $series,
            'teachers' => $teachers,
            'sections_by_teacher' => $sectionsByTeacher,
        ]);
    });

    Route::post('/admin/meeting-series', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);
        $tenantDb = DB::connection('center');

        $payload = $request->validate([
            'teacher_id' => ['required', 'integer'],
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'in:jitsi,livekit,zoom,microsoft_teams,google_meet,external,offline'],
            'week_days' => ['required', 'array', 'min:1', 'max:7'],
            'week_days.*' => ['integer', 'min:1', 'max:7'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_time' => ['required', 'date_format:H:i'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],
            'record_enabled' => ['nullable', 'boolean'],
            'generate_value' => ['nullable', 'integer', 'min:1', 'max:24'],
            'generate_unit' => ['nullable', 'in:weeks,months'],
            'join_url' => ['nullable', 'string', 'max:2000'],
            'moderator_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'max:255'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $teacher = Schema::connection('center')->hasTable('teachers')
            ? $tenantDb->table('teachers')->where('id', (int) $payload['teacher_id'])->first()
            : null;
        if (!$teacher || empty($teacher->email)) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }
        $teacherEmail = (string) $teacher->email;

        $section = Schema::connection('center')->hasTable('sections')
            ? $tenantDb->table('sections')->where('id', (int) $payload['section_id'])->first()
            : null;
        if (!$section) {
            return response()->json(['message' => 'Section not found'], 404);
        }

        $assignedIds = collect();
        if (Schema::connection('center')->hasTable('sections') && Schema::connection('center')->hasColumn('sections', 'teacher_id')) {
            $assignedIds = $assignedIds->merge(
                $tenantDb->table('sections')->where('teacher_id', (int) $payload['teacher_id'])->pluck('id')
            );
        }
        if (Schema::connection('center')->hasTable('teacher_section')) {
            $assignedIds = $assignedIds->merge(
                $tenantDb->table('teacher_section')->where('teacher_id', (int) $payload['teacher_id'])->pluck('section_id')
            );
        }
        $assignedIds = $assignedIds->unique()->values();
        if (!$assignedIds->contains((int) $payload['section_id'])) {
            return response()->json(['message' => 'Section is not assigned to this teacher'], 422);
        }

        $provider = (string) $payload['provider'];
        if (in_array($provider, ['external', 'zoom', 'microsoft_teams', 'google_meet'], true) && empty($payload['join_url'])) {
            return response()->json(['message' => 'join_url is required for this provider'], 422);
        }
        if ($provider === 'offline' && empty($payload['location'])) {
            return response()->json(['message' => 'location is required for offline provider'], 422);
        }

        $seriesPayload = [
            'created_by' => $teacherEmail,
            'grade_id' => (int) ($section->grade_id ?? 0),
            'class_id' => (int) ($section->class_id ?? 0),
            'section_id' => (int) $payload['section_id'],
            'topic' => (string) $payload['topic'],
            'provider' => $provider,
            'week_days' => array_values($payload['week_days']),
            'start_date' => $payload['start_date'],
            'end_date' => $payload['end_date'] ?? null,
            'start_time' => $payload['start_time'],
            'duration' => (int) $payload['duration'],
            'record_enabled' => (bool) ($payload['record_enabled'] ?? false),
            'join_url' => $payload['join_url'] ?? null,
            'moderator_url' => $payload['moderator_url'] ?? null,
            'password' => $payload['password'] ?? null,
            'external_ref' => $payload['external_ref'] ?? null,
            'location' => $payload['location'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ];
        if (Schema::connection('center')->hasColumn('meeting_series', 'teacher_id')) {
            $seriesPayload['teacher_id'] = (int) $payload['teacher_id'];
        }
        if (Schema::connection('center')->hasColumn('meeting_series', 'status')) {
            $seriesPayload['status'] = 'started';
        }
        $series = \App\Models\MeetingSeries::create($seriesPayload);

        $generateValue = (int) ($payload['generate_value'] ?? 8);
        $generateUnit = (string) ($payload['generate_unit'] ?? 'weeks');
        $generateTo = now();
        if ($generateUnit === 'months') {
            $generateTo = $generateTo->addMonths($generateValue);
        } else {
            $generateTo = $generateTo->addWeeks($generateValue);
        }
        \App\Services\MeetingSeriesGenerator::generateForSeries($series, now()->subDay(), $generateTo);

        return response()->json(['ok' => true]);
    });

    Route::delete('/admin/meeting-series/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        $series = \App\Models\MeetingSeries::query()->where('id', $id)->first();
        if (!$series) {
            return response()->json(['message' => 'Not found'], 404);
        }
        \App\Models\Meeting::query()->where('series_id', (int) $series->id)->delete();
        $series->delete();
        return response()->json(['ok' => true]);
    });

    Route::get('/admin/meetings', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Schema::connection('center')->hasTable('meetings')) {
            return response()->json(['meetings' => [], 'series_options' => []]);
        }

        $tenantDb = DB::connection('center');
        $hasSeriesCol = Schema::connection('center')->hasColumn('meetings', 'series_id');
        $hasLocationCol = Schema::connection('center')->hasColumn('meetings', 'location');

        $rows = $tenantDb->table('meetings')
            ->leftJoin('sections', 'meetings.section_id', '=', 'sections.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->select(
                'meetings.id',
                'meetings.grade_id',
                'meetings.class_id',
                'meetings.section_id',
                'meetings.topic',
                'meetings.start_at',
                'meetings.duration',
                'meetings.provider',
                'meetings.room_slug',
                'meetings.join_url',
                'meetings.moderator_url',
                'meetings.password',
                'meetings.record_enabled',
                'meetings.external_ref',
                'meetings.created_by',
                DB::raw("trim(concat_ws(' - ', nullif(grades.grade_name, ''), nullif(classes.class_name, ''), nullif(sections.section_name, ''))) as section_label")
            );

        if ($hasSeriesCol) {
            $rows->addSelect('meetings.series_id');
        }
        if ($hasLocationCol) {
            $rows->addSelect('meetings.location', 'meetings.notes');
        }

        $meetings = $rows->orderByDesc('meetings.start_at')->get()->map(function ($row) use ($hasSeriesCol, $hasLocationCol) {
            $m = [
                'id' => (int) $row->id,
                'grade_id' => (int) $row->grade_id,
                'class_id' => (int) $row->class_id,
                'section_id' => (int) $row->section_id,
                'section_label' => (string) ($row->section_label ?? ''),
                'topic' => (string) $row->topic,
                'start_at' => $row->start_at ? (string) $row->start_at : '',
                'duration' => (int) $row->duration,
                'provider' => (string) ($row->provider ?? 'jitsi'),
                'room_slug' => $row->room_slug ?? null,
                'join_url' => $row->join_url ?? null,
                'moderator_url' => $row->moderator_url ?? null,
                'password' => $row->password ?? null,
                'record_enabled' => (bool) ($row->record_enabled ?? false),
                'external_ref' => $row->external_ref ?? null,
                'created_by' => (string) ($row->created_by ?? ''),
            ];
            if ($hasSeriesCol) {
                $m['series_id'] = isset($row->series_id) && $row->series_id !== null ? (int) $row->series_id : null;
            }
            if ($hasLocationCol) {
                $m['location'] = $row->location ?? '';
                $m['notes'] = $row->notes ?? '';
            }

            return $m;
        })->values();

        $seriesOptions = collect();
        if (Schema::connection('center')->hasTable('meeting_series')) {
            $seriesOptions = $tenantDb->table('meeting_series')
                ->orderBy('topic')
                ->get(['id', 'topic', 'section_id'])
                ->map(fn ($s) => [
                    'id' => (int) $s->id,
                    'topic' => (string) $s->topic,
                    'section_id' => (int) $s->section_id,
                ])
                ->values();
        }

        return response()->json([
            'meetings' => $meetings,
            'series_options' => $seriesOptions,
        ]);
    });

    Route::post('/admin/meetings', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Schema::connection('center')->hasTable('meetings')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $tenantDb = DB::connection('center');
        $hasSeriesCol = Schema::connection('center')->hasColumn('meetings', 'series_id');
        $hasLocationCol = Schema::connection('center')->hasColumn('meetings', 'location');

        $payload = $request->validate([
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],
            'provider' => ['required', 'in:jitsi,livekit,external,offline,zoom,microsoft_teams,google_meet'],
            'series_id' => ['nullable', 'integer'],
            'join_url' => ['nullable', 'string', 'max:2000'],
            'moderator_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'max:255'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'record_enabled' => ['nullable', 'boolean'],
        ]);

        $section = $tenantDb->table('sections')->where('id', (int) $payload['section_id'])->first();
        if (!$section) {
            return response()->json(['message' => 'Section not found'], 404);
        }
        $gradeId = (int) ($section->grade_id ?? 0);
        $classId = (int) ($section->class_id ?? 0);
        $sectionId = (int) $payload['section_id'];

        $provider = (string) $payload['provider'];
        $urlProviders = ['external', 'zoom', 'microsoft_teams', 'google_meet'];
        if (in_array($provider, $urlProviders, true) && empty($payload['join_url'])) {
            return response()->json(['message' => 'join_url is required for this provider'], 422);
        }
        if ($provider === 'offline' && empty($payload['location'])) {
            return response()->json(['message' => 'location is required for offline provider'], 422);
        }

        $seriesId = isset($payload['series_id']) ? (int) $payload['series_id'] : null;
        if ($hasSeriesCol && $seriesId) {
            $seriesRow = $tenantDb->table('meeting_series')->where('id', $seriesId)->first();
            if (!$seriesRow) {
                return response()->json(['message' => 'Meeting series not found'], 404);
            }
            if ((int) ($seriesRow->section_id ?? 0) !== $sectionId) {
                return response()->json(['message' => 'series_id does not belong to this section'], 422);
            }
        } elseif ($seriesId) {
            $seriesId = null;
        }

        $createdBy = (string) (optional(Auth::guard('web')->user())->email ?? 'Admin');

        $base = [
            'grade_id' => $gradeId,
            'class_id' => $classId,
            'section_id' => $sectionId,
            'created_by' => $createdBy,
            'topic' => (string) $payload['topic'],
            'start_at' => $payload['start_at'],
            'duration' => (int) $payload['duration'],
            'password' => $payload['password'] ?? null,
            'record_enabled' => (bool) ($payload['record_enabled'] ?? false),
            'provider' => $provider,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasLocationCol) {
            $base['location'] = $payload['location'] ?? null;
            $base['notes'] = $payload['notes'] ?? null;
        }
        if ($hasSeriesCol) {
            $base['series_id'] = $seriesId ?: null;
        }

        $insertRow = function (array $extra) use ($tenantDb, $base) {
            try {
                $tenantDb->table('meetings')->insert(array_merge($base, $extra));

                return response()->json(['ok' => true]);
            } catch (QueryException $e) {
                if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                    return response()->json(['message' => 'A meeting with this series and start time already exists.'], 422);
                }
                throw $e;
            }
        };

        if ($provider === 'offline') {
            return $insertRow([
                'room_slug' => null,
                'join_url' => '#',
                'moderator_url' => null,
                'external_ref' => null,
                'password' => null,
            ]);
        }
        if ($provider === 'jitsi') {
            $links = \App\Services\MeetingLinkService::forJitsi();

            return $insertRow([
                'room_slug' => $links['room_slug'],
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'external_ref' => null,
            ]);
        }
        if ($provider === 'livekit') {
            if (! \App\Services\LiveKitAccessTokenService::isConfigured()) {
                return response()->json(['message' => 'LiveKit is not configured on the server'], 422);
            }
            $slug = \App\Services\MeetingLinkService::generateRoomSlug();
            $links = \App\Services\MeetingLinkService::forLiveKit($slug);

            return $insertRow([
                'room_slug' => $slug,
                'join_url' => $links['join_url'],
                'moderator_url' => $links['moderator_url'],
                'external_ref' => null,
            ]);
        }

        return $insertRow([
            'room_slug' => null,
            'join_url' => (string) $payload['join_url'],
            'moderator_url' => $payload['moderator_url'] ?? null,
            'external_ref' => $payload['external_ref'] ?? null,
        ]);
    });

    Route::put('/admin/meetings/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Schema::connection('center')->hasTable('meetings')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $tenantDb = DB::connection('center');
        $hasSeriesCol = Schema::connection('center')->hasColumn('meetings', 'series_id');
        $hasLocationCol = Schema::connection('center')->hasColumn('meetings', 'location');

        $existing = $tenantDb->table('meetings')->where('id', $id)->first();
        if (!$existing) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $payload = $request->validate([
            'section_id' => ['required', 'integer'],
            'topic' => ['required', 'string', 'max:255'],
            'start_at' => ['required', 'date'],
            'duration' => ['required', 'integer', 'min:15', 'max:480'],
            'provider' => ['required', 'in:jitsi,livekit,external,offline,zoom,microsoft_teams,google_meet'],
            'series_id' => ['nullable', 'integer'],
            'join_url' => ['nullable', 'string', 'max:2000'],
            'moderator_url' => ['nullable', 'string', 'max:2000'],
            'password' => ['nullable', 'string', 'max:255'],
            'external_ref' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'record_enabled' => ['nullable', 'boolean'],
        ]);

        $section = $tenantDb->table('sections')->where('id', (int) $payload['section_id'])->first();
        if (!$section) {
            return response()->json(['message' => 'Section not found'], 404);
        }
        $gradeId = (int) ($section->grade_id ?? 0);
        $classId = (int) ($section->class_id ?? 0);
        $sectionId = (int) $payload['section_id'];

        $provider = (string) $payload['provider'];
        $urlProviders = ['external', 'zoom', 'microsoft_teams', 'google_meet'];
        if (in_array($provider, $urlProviders, true) && empty($payload['join_url'])) {
            return response()->json(['message' => 'join_url is required for this provider'], 422);
        }
        if ($provider === 'offline' && empty($payload['location'])) {
            return response()->json(['message' => 'location is required for offline provider'], 422);
        }

        $seriesId = isset($payload['series_id']) ? (int) $payload['series_id'] : null;
        if ($hasSeriesCol && $seriesId) {
            $seriesRow = $tenantDb->table('meeting_series')->where('id', $seriesId)->first();
            if (!$seriesRow) {
                return response()->json(['message' => 'Meeting series not found'], 404);
            }
            if ((int) ($seriesRow->section_id ?? 0) !== $sectionId) {
                return response()->json(['message' => 'series_id does not belong to this section'], 422);
            }
        } elseif ($seriesId) {
            $seriesId = null;
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
            'provider' => $provider,
            'updated_at' => now(),
        ];
        if ($hasLocationCol) {
            $update['location'] = $payload['location'] ?? null;
            $update['notes'] = $payload['notes'] ?? null;
        }
        if ($hasSeriesCol) {
            $update['series_id'] = $seriesId ?: null;
        }

        if ($provider === 'offline') {
            $update['room_slug'] = null;
            $update['join_url'] = '#';
            $update['moderator_url'] = null;
            $update['external_ref'] = null;
            $update['password'] = null;
        } elseif ($provider === 'jitsi') {
            if (($existing->provider ?? '') !== 'jitsi' || empty($existing->room_slug)) {
                $links = \App\Services\MeetingLinkService::forJitsi();
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
                $slug = \App\Services\MeetingLinkService::generateRoomSlug();
                $links = \App\Services\MeetingLinkService::forLiveKit($slug);
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
            $tenantDb->table('meetings')->where('id', $id)->update($update);
        } catch (QueryException $e) {
            if (str_contains((string) $e->getMessage(), 'Duplicate')) {
                return response()->json(['message' => 'A meeting with this series and start time already exists.'], 422);
            }
            throw $e;
        }

        return response()->json(['ok' => true]);
    });

    Route::delete('/admin/meetings/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if (!in_array($guard, ['web', 'admin'], true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        if (!Schema::connection('center')->hasTable('meetings')) {
            return response()->json(['message' => 'Module unavailable'], 422);
        }

        $deleted = DB::connection('center')->table('meetings')->where('id', $id)->delete();
        if (!$deleted) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json(['ok' => true]);
    });

    Route::get('/parent/portal', function (Request $request) {
        if ($request->session()->get('api_auth_guard') !== 'parent') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $email = $request->session()->get('api_profile_email');
        $userType = $request->session()->get('api_profile_user_type', Parents::class);
        if (! $email) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(app(MultiCenterPortalService::class)->parentPortal($email, $userType));
    });

    Route::get('/parent/bootstrap', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $bearer = ApiBearerAuth::resolve($request);
        $portalMode = $request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false);
        if ($portalMode) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type', Parents::class) ?: ($bearer['user_type'] ?? Parents::class);
            if ($email) {
                return response()->json(app(MultiCenterPortalService::class)->parentPortal($email, $userType));
            }
        }
        $guard = $request->session()->get('api_auth_guard', 'parent');
        if ($guard !== 'parent') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }
        $ensureTenantInitialized($tenant);

        $authParentId = Auth::guard('parent')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authParentId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $tenantDb = DB::connection('center');
        $hasTable = function (string $table): bool {
            return Schema::connection('center')->hasTable($table);
        };

        $children = collect();
        if ($hasTable('students')) {
            $children = $tenantDb->table('students')
                ->leftJoin('grades', 'students.grade_id', '=', 'grades.id')
                ->leftJoin('classes', 'students.class_id', '=', 'classes.id')
                ->leftJoin('sections', 'students.section_id', '=', 'sections.id')
                ->where('students.parent_id', $authParentId)
                ->select(
                    'students.id',
                    'students.name',
                    'students.grade_id',
                    'students.class_id',
                    'students.section_id',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name'
                )
                ->orderBy('students.name')
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => $row->name,
                        'grade' => $row->grade_name ?: ('Grade ' . ($row->grade_id ?? '-')),
                        'class' => $row->class_name ?: ('Class ' . ($row->class_id ?? '-')),
                        'section' => $row->section_name ?: ('Section ' . ($row->section_id ?? '-')),
                    ];
                })
                ->values();
        }
        $childrenIds = $children->pluck('id')->values();

        $attendance = collect();
        if ($childrenIds->isNotEmpty() && $hasTable('attendances')) {
            $attendance = $tenantDb->table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->whereIn('attendances.student_id', $childrenIds)
                ->orderByDesc('attendances.attendance_date')
                ->limit(500)
                ->get(['attendances.id', 'attendances.student_id', 'attendances.attendance_date', 'attendances.attendance_status', 'students.name as student_name'])
                ->map(function ($row) {
                    $status = ((int) $row->attendance_status) === 1 ? 'present' : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $row->student_name ?? '',
                        'date' => $row->attendance_date,
                        'status' => $status,
                    ];
                })
                ->values();
        }

        $fees = collect();
        if ($childrenIds->isNotEmpty() && $hasTable('payments')) {
            $fees = $tenantDb->table('payments')
                ->join('students', 'payments.student_id', '=', 'students.id')
                ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
                ->whereIn('payments.student_id', $childrenIds)
                ->orderByDesc('payments.payment_date')
                ->orderByDesc('payments.id')
                ->limit(500)
                ->get([
                    'payments.id',
                    'payments.student_id',
                    'payments.payment_date',
                    'payments.payment_status',
                    'payments.amount',
                    'payments.month',
                    'students.name as student_name',
                    'fees.title as fee_title',
                ])
                ->map(function ($row) {
                    $statusRaw = strtolower((string) ($row->payment_status ?? ''));
                    $status = in_array($statusRaw, ['paid', 'unpaid'], true) ? $statusRaw : 'pending';
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $row->student_name ?? '',
                        'item' => $row->fee_title ?: ('Fee ' . ($row->month ?? '')),
                        'amount' => (float) ($row->amount ?? 0),
                        'status' => $status,
                        'due_date' => $row->payment_date ?? now()->toDateString(),
                        'month' => $row->month ?? '',
                    ];
                })
                ->values();
        }

        $quizzes = collect();
        if ($childrenIds->isNotEmpty() && $hasTable('quiz_degrees')) {
            $quizzes = $tenantDb->table('quiz_degrees')
                ->join('students', 'quiz_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'quiz_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'quiz_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'quiz_degrees.grade_id', '=', 'grades.id')
                ->whereIn('quiz_degrees.student_id', $childrenIds)
                ->orderByDesc('quiz_degrees.quiz_date')
                ->limit(500)
                ->get([
                    'quiz_degrees.id',
                    'quiz_degrees.student_id',
                    'quiz_degrees.quiz_date',
                    'quiz_degrees.degree',
                    'quiz_degrees.notes',
                    'quiz_degrees.attendance_status',
                    'students.name as student_name',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                ])
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $row->student_name ?? '',
                        'date' => $row->quiz_date,
                        'degree' => $row->degree !== null ? (float) $row->degree : null,
                        'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                        'notes' => $row->notes ?? '',
                        'grade' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? '')),
                    ];
                })
                ->values();
        }

        $exams = collect();
        if ($childrenIds->isNotEmpty() && $hasTable('exam_degrees')) {
            $exams = $tenantDb->table('exam_degrees')
                ->join('students', 'exam_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'exam_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'exam_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'exam_degrees.grade_id', '=', 'grades.id')
                ->whereIn('exam_degrees.student_id', $childrenIds)
                ->orderByDesc('exam_degrees.exam_date')
                ->limit(500)
                ->get([
                    'exam_degrees.id',
                    'exam_degrees.student_id',
                    'exam_degrees.exam_date',
                    'exam_degrees.degree',
                    'exam_degrees.notes',
                    'exam_degrees.attendance_status',
                    'students.name as student_name',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                ])
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $row->student_name ?? '',
                        'date' => $row->exam_date,
                        'degree' => $row->degree !== null ? (float) $row->degree : null,
                        'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                        'notes' => $row->notes ?? '',
                        'grade' => trim(($row->grade_name ? $row->grade_name . ' - ' : '') . ($row->class_name ?? '') . ' - ' . ($row->section_name ?? '')),
                    ];
                })
                ->values();
        }

        $reports = $children->map(function ($child) use ($attendance, $fees, $quizzes, $exams) {
            $childAttendance = $attendance->where('student_id', $child['id'])->values();
            $presentCount = $childAttendance->whereIn('status', ['present', 'late'])->count();
            $attendanceRate = $childAttendance->count() > 0 ? round(($presentCount / $childAttendance->count()) * 100, 1) : 0;
            $quizAvg = round((float) $quizzes->where('student_id', $child['id'])->whereNotNull('degree')->avg('degree'), 1);
            $examAvg = round((float) $exams->where('student_id', $child['id'])->whereNotNull('degree')->avg('degree'), 1);
            $paidAmount = (float) $fees->where('student_id', $child['id'])->where('status', 'paid')->sum('amount');
            $pendingAmount = (float) $fees->where('student_id', $child['id'])->whereIn('status', ['pending', 'unpaid'])->sum('amount');
            return [
                'student_id' => $child['id'],
                'student_name' => $child['name'],
                'grade' => trim(($child['grade'] ?? '') . ' - ' . ($child['class'] ?? '') . ' - ' . ($child['section'] ?? '')),
                'attendance_rate' => $attendanceRate,
                'quiz_average' => $quizAvg > 0 ? $quizAvg : null,
                'exam_average' => $examAvg > 0 ? $examAvg : null,
                'paid_amount' => $paidAmount,
                'pending_amount' => $pendingAmount,
            ];
        })->values();

        return response()->json([
            'children' => $children,
            'attendance' => $attendance,
            'fees' => $fees,
            'quizzes' => $quizzes,
            'exams' => $exams,
            'reports' => $reports,
        ]);
    });

    $resolveStudentContext = function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'student');
        if ($guard !== 'student') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403)];
        }
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return ['error' => response()->json(['message' => 'Tenant not found'], 422)];
        }
        $ensureTenantInitialized($tenant);

        $studentId = Auth::guard('student')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$studentId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401)];
        }
        $tenantDb = DB::connection('center');
        $student = $tenantDb->table('students')->where('id', $studentId)->first();
        if (!$student) {
            return ['error' => response()->json(['message' => 'Student not found'], 404)];
        }
        return ['error' => null, 'tenantDb' => $tenantDb, 'studentId' => (int) $studentId, 'student' => $student];
    };

    Route::get('/student/portal', function (Request $request) {
        if ($request->session()->get('api_auth_guard') !== 'student') {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        $email = $request->session()->get('api_profile_email');
        $userType = $request->session()->get('api_profile_user_type', Student::class);
        if (! $email) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(app(MultiCenterPortalService::class)->studentPortal($email, $userType));
    });

    Route::get('/student/bootstrap', function (Request $request) use ($resolveStudentContext) {
        $bearer = ApiBearerAuth::resolve($request);
        $portalMode = $request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false);
        if ($portalMode) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type', Student::class) ?: ($bearer['user_type'] ?? Student::class);
            if ($email) {
                return response()->json(app(MultiCenterPortalService::class)->studentPortal($email, $userType));
            }
        }

        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) {
            return $ctx['error'];
        }
        $tenantDb = $ctx['tenantDb'];
        $studentId = $ctx['studentId'];
        $student = $ctx['student'];
        $gradeId = (int) ($student->grade_id ?? 0);
        $classId = (int) ($student->class_id ?? 0);
        $sectionId = (int) ($student->section_id ?? 0);

        $meetings = collect();
        if (Schema::connection('center')->hasTable('meetings')) {
            $livekitUrl = (string) config('meetings.livekit.url');
            $meetings = $tenantDb->table('meetings')
                ->where('grade_id', $gradeId)
                ->where('class_id', $classId)
                ->where('section_id', $sectionId)
                ->orderByDesc('start_at')
                ->get(['id', 'topic', 'created_by', 'start_at', 'duration', 'provider', 'room_slug', 'join_url', 'moderator_url', 'password', 'record_enabled', 'external_ref', 'location', 'notes'])
                ->map(function ($row) use ($livekitUrl) {
                    $provider = $row->provider ?? 'jitsi';

                    return [
                        'id' => (int) $row->id,
                        'topic' => $row->topic,
                        'teacher' => $row->created_by ?: 'Teacher',
                        'start_at' => (string) $row->start_at,
                        'duration' => (int) ($row->duration ?? 0),
                        'provider' => $provider,
                        'room_slug' => $row->room_slug ?? '',
                        'password' => $row->password ?? '',
                        'moderator_url' => $row->moderator_url ?? '',
                        'join_url' => $row->join_url ?? '',
                        'record_enabled' => (bool) ($row->record_enabled ?? false),
                        'external_ref' => $row->external_ref ?? '',
                        'location' => $row->location ?? '',
                        'notes' => $row->notes ?? '',
                        'livekit_url' => $provider === 'livekit' ? $livekitUrl : '',
                    ];
                })
                ->values();
        }

        $attendance = collect();
        if (Schema::connection('center')->hasTable('attendances')) {
            $attendance = $tenantDb->table('attendances')
                ->where('student_id', $studentId)
                ->orderByDesc('attendance_date')
                ->limit(300)
                ->get(['id', 'attendance_date', 'attendance_status', 'notes'])
                ->map(function ($row) {
                    $status = ((int) $row->attendance_status) === 1 ? 'present' : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');
                    return [
                        'id' => (int) $row->id,
                        'date' => (string) $row->attendance_date,
                        'status' => $status,
                        'notes' => $row->notes ?? '',
                    ];
                })
                ->values();
        }

        $grades = collect();
        if (Schema::connection('center')->hasTable('exam_degrees')) {
            $grades = $grades->merge(
                $tenantDb->table('exam_degrees')
                    ->where('student_id', $studentId)
                    ->orderByDesc('exam_date')
                    ->get(['id', 'exam_date', 'degree', 'attendance_status', 'notes'])
                    ->map(function ($row) {
                        return [
                            'id' => (int) $row->id,
                            'source' => 'exam',
                            'subject' => 'Exam',
                            'date' => (string) $row->exam_date,
                            'score' => is_numeric($row->degree) ? (float) $row->degree : null,
                            'total' => 100,
                            'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                            'notes' => $row->notes ?? '',
                        ];
                    })
            );
        }
        if (Schema::connection('center')->hasTable('quiz_degrees')) {
            $grades = $grades->merge(
                $tenantDb->table('quiz_degrees')
                    ->where('student_id', $studentId)
                    ->orderByDesc('quiz_date')
                    ->get(['id', 'quiz_date', 'degree', 'attendance_status', 'notes'])
                    ->map(function ($row) {
                        return [
                            'id' => (int) $row->id,
                            'source' => 'quiz',
                            'subject' => 'Quiz',
                            'date' => (string) $row->quiz_date,
                            'score' => is_numeric($row->degree) ? (float) $row->degree : null,
                            'total' => 20,
                            'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                            'notes' => $row->notes ?? '',
                        ];
                    })
            );
        }
        $grades = $grades->sortByDesc('date')->values();

        $homeworkOptions = collect();
        $homework = collect();
        if (Schema::connection('center')->hasTable('homeworks')) {
            $homeworks = $tenantDb->table('homeworks')
                ->where('grade_id', $gradeId)
                ->where('class_id', $classId)
                ->where('section_id', $sectionId)
                ->orderByDesc('due_date')
                ->limit(300)
                ->get(['id', 'title', 'due_date']);
            $homeworkOptions = $homeworks->map(fn ($h) => ['id' => (int) $h->id, 'title' => $h->title])->values();
            if (Schema::connection('center')->hasTable('student_homework')) {
                $submissions = $tenantDb->table('student_homework')->where('student_id', $studentId)->get()->keyBy('homework_id');
                $homework = $homeworks->map(function ($row) use ($submissions) {
                    $submission = $submissions->get($row->id);
                    return [
                        'id' => $submission ? (int) $submission->id : ('h-' . $row->id),
                        'submission_id' => $submission ? (int) $submission->id : null,
                        'homework_id' => (int) $row->id,
                        'title' => $row->title,
                        'subject' => 'Homework',
                        'due_date' => (string) $row->due_date,
                        'status' => $submission->status ?? 'not_submitted',
                        'grade' => $submission->degree ?? '—',
                        'student_notes' => $submission->student_notes ?? '',
                        'response' => $submission->response ?? '',
                    ];
                })->values();
            } else {
                $homework = $homeworks->map(fn ($row) => [
                    'id' => 'h-' . $row->id,
                    'submission_id' => null,
                    'homework_id' => (int) $row->id,
                    'title' => $row->title,
                    'subject' => 'Homework',
                    'due_date' => (string) $row->due_date,
                    'status' => 'not_submitted',
                    'grade' => '—',
                    'student_notes' => '',
                    'response' => '',
                ])->values();
            }
        }

        $library = collect();
        if (Schema::connection('center')->hasTable('library')) {
            $library = $tenantDb->table('library')
                ->where('grade_id', $gradeId)
                ->where('class_id', $classId)
                ->where('section_id', $sectionId)
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->limit(300)
                ->get(['id', 'title', 'type', 'notes'])
                ->map(function ($row) {
                    $book = Library::query()->find($row->id);
                    return [
                        'id' => (int) $row->id,
                        'title' => $row->title,
                        'type' => $row->type ?: 'resource',
                        'notes' => $row->notes ?? '',
                        'url' => $book?->getFirstMediaUrl('library') ?: null,
                    ];
                })
                ->values();
        }

        return response()->json([
            'meetings' => $meetings,
            'attendance' => $attendance,
            'grades' => $grades,
            'homework' => $homework,
            'homework_options' => $homeworkOptions,
            'library' => $library,
        ]);
    });

    Route::post('/student/meetings', function () {
        return response()->json(['message' => 'Students can only view meetings.'], 403);
    });

    Route::put('/student/meetings/{id}', function () {
        return response()->json(['message' => 'Students can only view meetings.'], 403);
    });

    Route::delete('/student/meetings/{id}', function () {
        return response()->json(['message' => 'Students can only view meetings.'], 403);
    });

    Route::get('/student/meetings/{id}/livekit-token', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('meetings')) return response()->json(['message' => 'Module unavailable'], 422);
        if (! \App\Services\LiveKitAccessTokenService::isConfigured()) {
            return response()->json(['message' => 'LiveKit is not configured'], 422);
        }
        $row = $tenantDb->table('meetings')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->first();
        if (!$row || ($row->provider ?? '') !== 'livekit' || empty($row->room_slug)) {
            return response()->json(['message' => 'Meeting not found'], 404);
        }
        $identity = 'student-'.$ctx['studentId'];
        $token = \App\Services\LiveKitAccessTokenService::createToken(
            (string) $row->room_slug,
            $identity,
            false,
            false
        );

        return response()->json([
            'token' => $token,
            'url' => config('meetings.livekit.url'),
            'room' => $row->room_slug,
        ]);
    });

    Route::post('/student/attendance', function (Request $request) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('attendances')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $status = $payload['status'] === 'present' ? 1 : ($payload['status'] === 'late' ? 2 : 0);
        $tenantDb->table('attendances')->insert([
            'student_id' => $ctx['studentId'],
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'attendance_date' => $payload['date'],
            'attendance_status' => $status,
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });
    Route::put('/student/attendance/{id}', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('attendances')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'date' => ['required', 'date'],
            'status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $status = $payload['status'] === 'present' ? 1 : ($payload['status'] === 'late' ? 2 : 0);
        $updated = $tenantDb->table('attendances')->where('id', $id)->where('student_id', $ctx['studentId'])->update([
            'attendance_date' => $payload['date'],
            'attendance_status' => $status,
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);
        if (!$updated) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });
    Route::delete('/student/attendance/{id}', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('attendances')) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table('attendances')->where('id', $id)->where('student_id', $ctx['studentId'])->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });

    Route::post('/student/grades', function (Request $request) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        $payload = $request->validate([
            'source' => ['required', 'in:exam,quiz'],
            'date' => ['required', 'date'],
            'degree' => ['nullable', 'numeric'],
            'attendance_status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $table = $payload['source'] === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        if (!Schema::connection('center')->hasTable($table)) return response()->json(['message' => 'Module unavailable'], 422);
        $dateCol = $payload['source'] === 'exam' ? 'exam_date' : 'quiz_date';
        $tenantDb->table($table)->insert([
            'student_id' => $ctx['studentId'],
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'attendance_status' => $payload['attendance_status'],
            $dateCol => $payload['date'],
            'degree' => $payload['degree'] !== null ? (string) $payload['degree'] : '',
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });
    Route::put('/student/grades/{source}/{id}', function (Request $request, string $source, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!in_array($source, ['exam', 'quiz'], true)) return response()->json(['message' => 'Invalid source'], 422);
        $payload = $request->validate([
            'date' => ['required', 'date'],
            'degree' => ['nullable', 'numeric'],
            'attendance_status' => ['required', 'in:present,absent,late'],
            'notes' => ['nullable', 'string'],
        ]);
        $table = $source === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        if (!Schema::connection('center')->hasTable($table)) return response()->json(['message' => 'Module unavailable'], 422);
        $dateCol = $source === 'exam' ? 'exam_date' : 'quiz_date';
        $updated = $tenantDb->table($table)->where('id', $id)->where('student_id', $ctx['studentId'])->update([
            $dateCol => $payload['date'],
            'degree' => $payload['degree'] !== null ? (string) $payload['degree'] : '',
            'attendance_status' => $payload['attendance_status'],
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);
        if (!$updated) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });
    Route::delete('/student/grades/{source}/{id}', function (Request $request, string $source, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!in_array($source, ['exam', 'quiz'], true)) return response()->json(['message' => 'Invalid source'], 422);
        $table = $source === 'exam' ? 'exam_degrees' : 'quiz_degrees';
        if (!Schema::connection('center')->hasTable($table)) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table($table)->where('id', $id)->where('student_id', $ctx['studentId'])->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });

    Route::post('/student/homework/submissions', function (Request $request) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'homework_id' => ['required', 'integer', 'exists:center.homeworks,id'],
            'status' => ['required', 'in:not_submitted,submitted,late,approved,rejected'],
            'student_notes' => ['nullable', 'string'],
            'response' => ['nullable', 'string'],
            'degree' => ['nullable', 'string', 'max:100'],
            'rate' => ['nullable', 'string', 'max:100'],
        ]);
        $tenantDb->table('student_homework')->insert([
            'student_id' => $ctx['studentId'],
            'homework_id' => (int) $payload['homework_id'],
            'upload_date_time' => now(),
            'status' => $payload['status'],
            'degree' => $payload['degree'] ?? null,
            'rate' => $payload['rate'] ?? null,
            'student_notes' => $payload['student_notes'] ?? null,
            'response' => $payload['response'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });
    Route::put('/student/homework/submissions/{id}', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'homework_id' => ['required', 'integer', 'exists:center.homeworks,id'],
            'status' => ['required', 'in:not_submitted,submitted,late,approved,rejected'],
            'student_notes' => ['nullable', 'string'],
            'response' => ['nullable', 'string'],
            'degree' => ['nullable', 'string', 'max:100'],
            'rate' => ['nullable', 'string', 'max:100'],
        ]);
        $updated = $tenantDb->table('student_homework')->where('id', $id)->where('student_id', $ctx['studentId'])->update([
            'homework_id' => (int) $payload['homework_id'],
            'status' => $payload['status'],
            'degree' => $payload['degree'] ?? null,
            'rate' => $payload['rate'] ?? null,
            'student_notes' => $payload['student_notes'] ?? null,
            'response' => $payload['response'] ?? null,
            'updated_at' => now(),
        ]);
        if (!$updated) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });
    Route::delete('/student/homework/submissions/{id}', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        if (!Schema::connection('center')->hasTable('student_homework')) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table('student_homework')->where('id', $id)->where('student_id', $ctx['studentId'])->delete();
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });

    Route::post('/student/library', function (Request $request) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('library')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
        ]);
        $tenantDb->table('library')->insert([
            'title' => $payload['title'],
            'grade_id' => (int) $student->grade_id,
            'class_id' => (int) $student->class_id,
            'section_id' => (int) $student->section_id,
            'type' => $payload['type'],
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });
    Route::put('/student/library/{id}', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('library')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
        ]);
        $updated = $tenantDb->table('library')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->whereNull('deleted_at')
            ->update([
                'title' => $payload['title'],
                'type' => $payload['type'],
                'notes' => $payload['notes'] ?? null,
                'updated_at' => now(),
            ]);
        if (!$updated) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });
    Route::delete('/student/library/{id}', function (Request $request, int $id) use ($resolveStudentContext) {
        $ctx = $resolveStudentContext($request);
        if ($ctx['error']) return $ctx['error'];
        $tenantDb = $ctx['tenantDb'];
        $student = $ctx['student'];
        if (!Schema::connection('center')->hasTable('library')) return response()->json(['message' => 'Module unavailable'], 422);
        $deleted = $tenantDb->table('library')
            ->where('id', $id)
            ->where('grade_id', (int) $student->grade_id)
            ->where('class_id', (int) $student->class_id)
            ->where('section_id', (int) $student->section_id)
            ->whereNull('deleted_at')
            ->update(['deleted_at' => now(), 'updated_at' => now()]);
        if (!$deleted) return response()->json(['message' => 'Not found'], 404);
        return response()->json(['ok' => true]);
    });

    $resolvePlatformContext = function (Request $request) use ($centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'platform_admin');
        if ($guard !== 'platform_admin') {
            return ['error' => response()->json(['message' => 'Forbidden'], 403)];
        }
        $authUserId = Auth::guard('platform_admin')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) {
            return ['error' => response()->json(['message' => 'Unauthenticated'], 401)];
        }
        return ['error' => null, 'centralConnection' => $centralConnection, 'authUserId' => (int) $authUserId];
    };

    Route::get('/platform/centers', [PlatformCenterApiController::class, 'index']);
    Route::post('/platform/centers', [PlatformCenterApiController::class, 'store']);
    Route::put('/platform/centers/{id}', [PlatformCenterApiController::class, 'update']);
    Route::delete('/platform/centers/{id}', [PlatformCenterApiController::class, 'destroy']);
    Route::get('/platform/tenants', [PlatformCenterApiController::class, 'index']);
    Route::post('/platform/tenants', [PlatformCenterApiController::class, 'store']);
    Route::put('/platform/tenants/{id}', [PlatformCenterApiController::class, 'update']);
    Route::delete('/platform/tenants/{id}', [PlatformCenterApiController::class, 'destroy']);

    Route::get('/platform/branding', [PlatformBrandingApiController::class, 'show']);
    Route::put('/platform/branding', [PlatformBrandingApiController::class, 'update']);

    Route::get('/platform/subscriptions', function (Request $request) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $rows = DB::connection($conn)->table('tenant_infos as ti')
            ->leftJoin('tenants as t', 'ti.tenant_id', '=', 't.id')
            ->select('ti.id as info_id', 'ti.name', 't.data as tenant_data')
            ->orderByDesc('ti.id')
            ->get();
        $subscriptions = $rows->map(function ($row) {
            $data = [];
            if (!empty($row->tenant_data)) {
                $decoded = json_decode((string) $row->tenant_data, true);
                $data = is_array($decoded) ? $decoded : [];
            }
            $sub = data_get($data, 'subscription', []);

            return [
                'id' => (int) $row->info_id,
                'tenant_id' => (int) $row->info_id,
                'tenant_name' => $row->name,
                'plan' => data_get($sub, 'plan', data_get($data, 'plan', 'Starter')),
                'amount' => (float) data_get($sub, 'amount', 0),
                'billing_cycle' => data_get($sub, 'billing_cycle', 'monthly'),
                'status' => data_get($sub, 'status', 'trial'),
                'next_billing_date' => data_get($sub, 'next_billing_date', now()->addMonth()->toDateString()),
            ];
        })->values();
        return response()->json($subscriptions);
    });

    Route::post('/platform/subscriptions', function (Request $request) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $payload = $request->validate([
            'tenant_id' => ['nullable', 'integer'],
            'tenant_name' => ['nullable', 'string', 'max:255'],
            'plan' => ['required', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],
            'status' => ['nullable', 'in:active,trial,past_due,cancelled'],
            'next_billing_date' => ['nullable', 'date'],
        ]);
        $info = null;
        if (!empty($payload['tenant_id'])) {
            $info = DB::connection($conn)->table('tenant_infos')->where('id', (int) $payload['tenant_id'])->first();
        }
        if (!$info && !empty($payload['tenant_name'])) {
            $info = DB::connection($conn)->table('tenant_infos')->where('name', $payload['tenant_name'])->first();
        }
        if (!$info) return response()->json(['message' => 'Tenant not found'], 404);
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && !empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'plan', $payload['plan']);
        data_set($data, 'subscription', [
            'plan' => $payload['plan'],
            'amount' => (float) ($payload['amount'] ?? 0),
            'billing_cycle' => $payload['billing_cycle'] ?? 'monthly',
            'status' => $payload['status'] ?? 'trial',
            'next_billing_date' => $payload['next_billing_date'] ?? now()->addMonth()->toDateString(),
        ]);
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });

    Route::put('/platform/subscriptions/{id}', function (Request $request, int $id) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $info = DB::connection($conn)->table('tenant_infos')->where('id', $id)->first();
        if (!$info) return response()->json(['message' => 'Subscription not found'], 404);
        $payload = $request->validate([
            'plan' => ['required', 'string', 'max:100'],
            'amount' => ['nullable', 'numeric'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],
            'status' => ['nullable', 'in:active,trial,past_due,cancelled'],
            'next_billing_date' => ['nullable', 'date'],
        ]);
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && !empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'plan', $payload['plan']);
        data_set($data, 'subscription', [
            'plan' => $payload['plan'],
            'amount' => (float) ($payload['amount'] ?? 0),
            'billing_cycle' => $payload['billing_cycle'] ?? 'monthly',
            'status' => $payload['status'] ?? 'trial',
            'next_billing_date' => $payload['next_billing_date'] ?? now()->addMonth()->toDateString(),
        ]);
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });

    Route::delete('/platform/subscriptions/{id}', function (Request $request, int $id) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $info = DB::connection($conn)->table('tenant_infos')->where('id', $id)->first();
        if (!$info) return response()->json(['message' => 'Subscription not found'], 404);
        $tenantRow = DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->first();
        $data = [];
        if ($tenantRow && !empty($tenantRow->data)) {
            $decoded = json_decode((string) $tenantRow->data, true);
            $data = is_array($decoded) ? $decoded : [];
        }
        data_set($data, 'subscription.status', 'cancelled');
        DB::connection($conn)->table('tenants')->where('id', $info->tenant_id)->update([
            'data' => json_encode($data, JSON_UNESCAPED_UNICODE),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });

    Route::get('/platform/users', function (Request $request) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json([]);
        $users = DB::connection($conn)->table('admins')
            ->orderByDesc('id')
            ->get(['id', 'name', 'email', 'created_at'])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'email' => $row->email,
                    'role' => 'platform_admin',
                    'tenant_id' => null,
                    'tenant_name' => 'Platform',
                    'locale' => 'en',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                    'status' => 'active',
                ];
            })
            ->values();
        return response()->json($users);
    });

    Route::post('/platform/users', function (Request $request) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json(['message' => 'Module unavailable'], 422);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:' . $conn . '.admins,email'],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'role' => ['nullable', 'string'],
        ]);
        DB::connection($conn)->table('admins')->insert([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password'] ?? '123456'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['ok' => true]);
    });

    Route::put('/platform/users/{id}', function (Request $request, int $id) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json(['message' => 'Module unavailable'], 422);
        $exists = DB::connection($conn)->table('admins')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'User not found'], 404);
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:' . $conn . '.admins,email,' . $id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'role' => ['nullable', 'string'],
        ]);
        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'updated_at' => now(),
        ];
        if (!empty($payload['password'])) $update['password'] = Hash::make($payload['password']);
        DB::connection($conn)->table('admins')->where('id', $id)->update($update);
        return response()->json(['ok' => true]);
    });

    Route::delete('/platform/users/{id}', function (Request $request, int $id) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        if (!Schema::connection($conn)->hasTable('admins')) return response()->json(['message' => 'Module unavailable'], 422);
        DB::connection($conn)->table('admins')->where('id', $id)->delete();
        return response()->json(['ok' => true]);
    });

    Route::get('/platform/roles', function (Request $request) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $platformAdmins = Schema::connection($conn)->hasTable('admins')
            ? (int) DB::connection($conn)->table('admins')->count()
            : 0;
        $roles = collect([
            ['id' => 1, 'name' => 'platform_admin', 'guard' => 'platform_admin', 'permissions' => 0, 'users' => $platformAdmins],
            ['id' => 2, 'name' => 'admin', 'guard' => 'web', 'permissions' => 0, 'users' => 0],
            ['id' => 3, 'name' => 'teacher', 'guard' => 'teacher', 'permissions' => 0, 'users' => 0],
            ['id' => 4, 'name' => 'student', 'guard' => 'student', 'permissions' => 0, 'users' => 0],
            ['id' => 5, 'name' => 'parent', 'guard' => 'parent', 'permissions' => 0, 'users' => 0],
        ])->values();
        return response()->json(['roles' => $roles, 'can_manage' => false]);
    });

    Route::get('/platform/activity-logs', function (Request $request) use ($resolvePlatformContext) {
        $ctx = $resolvePlatformContext($request);
        if ($ctx['error']) return $ctx['error'];
        $conn = $ctx['centralConnection'];
        $tenantLogs = DB::connection($conn)->table('tenant_infos')
            ->orderByDesc('updated_at')
            ->limit(100)
            ->get(['id', 'tenant_id', 'name', 'status', 'updated_at'])
            ->map(function ($row) {
                $status = ((int) $row->status) === 1 ? 'active' : (((int) $row->status) === 2 ? 'suspended' : 'inactive');
                return [
                    'id' => (int) $row->id,
                    'description' => 'Tenant ' . $row->name . ' is ' . $status,
                    'causer_id' => null,
                    'created_at' => optional($row->updated_at)->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
                ];
            });
        $adminLogs = Schema::connection($conn)->hasTable('admins')
            ? DB::connection($conn)->table('admins')
                ->orderByDesc('updated_at')
                ->limit(100)
                ->get(['id', 'name', 'updated_at'])
                ->map(function ($row) {
                    return [
                        'id' => 100000 + (int) $row->id,
                        'description' => 'Platform user updated: ' . $row->name,
                        'causer_id' => (int) $row->id,
                        'created_at' => optional($row->updated_at)->format('Y-m-d H:i:s') ?? now()->toDateTimeString(),
                    ];
                })
            : collect();
        return response()->json($tenantLogs->merge($adminLogs)->sortByDesc('created_at')->take(200)->values());
    });

    Route::get('/dashboard', [DashboardApiController::class, 'show']);

    Route::get('/notifications/vapid-key', [NotificationApiController::class, 'vapidKey']);
    Route::get('/notifications', [NotificationApiController::class, 'index']);
    Route::post('/notifications/subscribe', [NotificationApiController::class, 'subscribe']);
    Route::post('/notifications/mark-all-read', [NotificationApiController::class, 'markAllRead']);
    Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markRead'])->whereUuid('id');
    Route::post('/admin/notifications/send', [NotificationApiController::class, 'adminSend']);

    // Locale-prefixed aliases (when StripApiLocalePrefix is not active / route cache)
    Route::prefix('{locale}')->where(['locale' => 'en|ar'])->group(function () {
        Route::get('/notifications/vapid-key', [NotificationApiController::class, 'vapidKey']);
        Route::get('/notifications', [NotificationApiController::class, 'index']);
        Route::post('/notifications/subscribe', [NotificationApiController::class, 'subscribe']);
        Route::post('/notifications/mark-all-read', [NotificationApiController::class, 'markAllRead']);
        Route::post('/notifications/{id}/read', [NotificationApiController::class, 'markRead'])->whereUuid('id');
        Route::post('/admin/notifications/send', [NotificationApiController::class, 'adminSend']);
    });

    Route::get('/admin/students/search-by-code', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

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
    });

    Route::post('/admin/students/{id}/assign-center', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

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
    });

    Route::post('/admin/students/{id}/unassign-center', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (! $tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

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
    });

    Route::post('/admin/students', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:tenant.students,code'],
            'email' => ['required', 'email', 'max:255', 'unique:tenant.students,email'],
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
    });

    Route::put('/admin/students/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

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
            'code' => ['required', 'string', 'max:50', 'unique:tenant.students,code,'.$id],
            'email' => ['required', 'email', 'max:255', 'unique:tenant.students,email,'.$id],
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
    });

    Route::post('/admin/teachers', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:tenant.teachers,email'],
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
    });

    Route::put('/admin/teachers/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $teacherExists = DB::connection('center')->table('teachers')->where('id', $id)->exists();
        if (!$teacherExists) {
            return response()->json(['message' => 'Teacher not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:tenant.teachers,email,'.$id],
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
    });

    Route::post('/admin/parents', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:tenant.parents,email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'address' => ['nullable', 'string', 'max:300'],
        ]);

        $parentsHasIsActive = Schema::connection('center')->hasColumn('parents', 'is_active');
        $insert = [
            'parent_name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'parent_phone' => $payload['phone'] ?? null,
            'parent_job' => $payload['job_title'] ?? null,
            'parent_address' => $payload['address'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($parentsHasIsActive) {
            $insert['is_active'] = ($payload['status'] ?? 'active') === 'active';
        }

        $id = DB::connection('center')->table('parents')->insertGetId($insert);

        app(CenterMembershipService::class)->assignMembership($tenant, (int) $id, Parents::class);

        $parent = DB::connection('center')->table('parents')->where('id', $id)->first();

        return response()->json([
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->parent_name,
                'email' => $parent->email,
                'phone' => $parent->parent_phone,
                'job_title' => $parent->parent_job,
                'address' => $parent->parent_address,
                'status' => isset($parent->is_active) ? ($parent->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
            ],
        ], 201);
    });

    Route::put('/admin/parents/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $ensureTenantInitialized($tenant);

        if (!Auth::guard('web')->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $exists = DB::connection('center')->table('parents')->where('id', $id)->exists();
        if (!$exists) {
            return response()->json(['message' => 'Parent not found'], 404);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:tenant.parents,email,'.$id],
            'password' => ['nullable', 'string', 'min:6', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
            'address' => ['nullable', 'string', 'max:300'],
        ]);

        $update = [
            'parent_name' => $payload['name'],
            'email' => $payload['email'],
            'parent_phone' => $payload['phone'] ?? null,
            'parent_job' => $payload['job_title'] ?? null,
            'parent_address' => $payload['address'] ?? null,
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('parents', 'is_active')) {
            $update['is_active'] = ($payload['status'] ?? 'active') === 'active';
        }
        if (!empty($payload['password'])) {
            $update['password'] = Hash::make($payload['password']);
        }

        DB::connection('center')->table('parents')->where('id', $id)->update($update);

        $parent = DB::connection('center')->table('parents')->where('id', $id)->first();

        return response()->json([
            'parent' => [
                'id' => $parent->id,
                'name' => $parent->parent_name,
                'email' => $parent->email,
                'phone' => $parent->parent_phone,
                'job_title' => $parent->parent_job,
                'address' => $parent->parent_address,
                'status' => isset($parent->is_active) ? ($parent->is_active ? 'active' : 'inactive') : ($payload['status'] ?? 'active'),
            ],
        ]);
    });

    Route::post('/admin/grades', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $id = DB::connection('center')->table('grades')->insertGetId([
            'grade_name' => $payload['name'],
            'notes' => $payload['notes'] ?? null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['grade' => ['id' => $id, 'name' => $payload['name'], 'notes' => $payload['notes'] ?? null]], 201);
    });

    Route::put('/admin/grades/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $exists = DB::connection('center')->table('grades')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Grade not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::connection('center')->table('grades')->where('id', $id)->update([
            'grade_name' => $payload['name'],
            'notes' => $payload['notes'] ?? null,
            'updated_at' => now(),
        ]);

        return response()->json(['grade' => ['id' => $id, 'name' => $payload['name'], 'notes' => $payload['notes'] ?? null]]);
    });

    Route::post('/admin/classes', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $insert = [
            'class_name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('classes', 'notes')) {
            $insert['notes'] = $payload['notes'] ?? null;
        }

        $id = DB::connection('center')->table('classes')->insertGetId($insert);
        return response()->json(['class' => ['id' => $id, 'name' => $payload['name'], 'grade_id' => $payload['grade_id'], 'notes' => $payload['notes'] ?? null]], 201);
    });

    Route::put('/admin/classes/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $exists = DB::connection('center')->table('classes')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Class not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'notes' => ['nullable', 'string'],
        ]);

        $update = [
            'class_name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('classes', 'notes')) {
            $update['notes'] = $payload['notes'] ?? null;
        }

        DB::connection('center')->table('classes')->where('id', $id)->update($update);
        return response()->json(['class' => ['id' => $id, 'name' => $payload['name'], 'grade_id' => $payload['grade_id'], 'notes' => $payload['notes'] ?? null]]);
    });

    Route::post('/admin/sections', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::put('/admin/sections/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::post('/admin/units', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'notes' => ['nullable', 'string'],
        ]);
        $id = DB::connection('center')->table('units')->insertGetId([
            'name' => $payload['name'],
            'class_id' => $payload['class_id'],
            'notes' => $payload['notes'] ?? '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['unit' => ['id' => $id, 'name' => $payload['name'], 'class_id' => $payload['class_id'], 'notes' => $payload['notes'] ?? '']], 201);
    });

    Route::put('/admin/units/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $exists = DB::connection('center')->table('units')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Unit not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'notes' => ['nullable', 'string'],
        ]);
        DB::connection('center')->table('units')->where('id', $id)->update([
            'name' => $payload['name'],
            'class_id' => $payload['class_id'],
            'notes' => $payload['notes'] ?? '',
            'updated_at' => now(),
        ]);
        return response()->json(['unit' => ['id' => $id, 'name' => $payload['name'], 'class_id' => $payload['class_id'], 'notes' => $payload['notes'] ?? '']]);
    });

    Route::post('/admin/lessons', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit_id' => ['required', 'integer', 'exists:center.units,id'],
            'notes' => ['nullable', 'string'],
        ]);
        $id = DB::connection('center')->table('lessons')->insertGetId([
            'name' => $payload['name'],
            'unit_id' => $payload['unit_id'],
            'notes' => $payload['notes'] ?? '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['lesson' => ['id' => $id, 'name' => $payload['name'], 'unit_id' => $payload['unit_id'], 'notes' => $payload['notes'] ?? '']], 201);
    });

    Route::put('/admin/lessons/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $exists = DB::connection('center')->table('lessons')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Lesson not found'], 404);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'unit_id' => ['required', 'integer', 'exists:center.units,id'],
            'notes' => ['nullable', 'string'],
        ]);
        DB::connection('center')->table('lessons')->where('id', $id)->update([
            'name' => $payload['name'],
            'unit_id' => $payload['unit_id'],
            'notes' => $payload['notes'] ?? '',
            'updated_at' => now(),
        ]);
        return response()->json(['lesson' => ['id' => $id, 'name' => $payload['name'], 'unit_id' => $payload['unit_id'], 'notes' => $payload['notes'] ?? '']]);
    });

    Route::post('/admin/homework', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::put('/admin/homework/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::post('/admin/fees', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:20'],
            'month' => ['required', 'string', 'max:20'],
            'type' => ['required', 'in:monthly,half-monthly,book,other'],
        ]);

        $insert = [
            'title' => $payload['title'],
            'amount' => $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? null,
            'month' => $payload['month'],
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('fees', 'fee_type')) {
            $insert['fee_type'] = $payload['type'];
        } elseif (Schema::connection('center')->hasColumn('fees', 'Fee_type')) {
            $insert['Fee_type'] = $payload['type'];
        }

        $id = DB::connection('center')->table('fees')->insertGetId($insert);

        return response()->json(['fee' => [
            'id' => $id,
            'title' => $payload['title'],
            'amount' => (float) $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? '',
            'month' => $payload['month'],
            'type' => $payload['type'],
        ]], 201);
    });

    Route::put('/admin/fees/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $exists = DB::connection('center')->table('fees')->where('id', $id)->exists();
        if (!$exists) return response()->json(['message' => 'Fee not found'], 404);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'classroom_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'string', 'max:20'],
            'month' => ['required', 'string', 'max:20'],
            'type' => ['required', 'in:monthly,half-monthly,book,other'],
        ]);

        $update = [
            'title' => $payload['title'],
            'amount' => $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? null,
            'month' => $payload['month'],
            'updated_at' => now(),
        ];
        if (Schema::connection('center')->hasColumn('fees', 'fee_type')) {
            $update['fee_type'] = $payload['type'];
        } elseif (Schema::connection('center')->hasColumn('fees', 'Fee_type')) {
            $update['Fee_type'] = $payload['type'];
        }

        DB::connection('center')->table('fees')->where('id', $id)->update($update);

        return response()->json(['fee' => [
            'id' => $id,
            'title' => $payload['title'],
            'amount' => (float) $payload['amount'],
            'grade_id' => $payload['grade_id'],
            'classroom_id' => $payload['classroom_id'],
            'section_id' => $payload['section_id'],
            'description' => $payload['description'] ?? null,
            'year' => $payload['year'] ?? '',
            'month' => $payload['month'],
            'type' => $payload['type'],
        ]]);
    });

    Route::delete('/admin/fees/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        DB::connection('center')->table('fees')->where('id', $id)->delete();
        return response()->json(['message' => 'Fee deleted']);
    });

    Route::get('/admin/users', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        $hasRoles = Schema::connection('center')->hasTable('roles') && Schema::connection('center')->hasTable('model_has_roles');

        $query = $tenantDb->table('users')->select('users.id', 'users.name', 'users.email', 'users.created_at');
        if ($hasPhone) $query->addSelect('users.phone');
        if ($hasIsActive) $query->addSelect('users.is_active');
        if ($hasRoles) {
            $query
                ->leftJoin('model_has_roles', function ($join) {
                    $join->on('users.id', '=', 'model_has_roles.model_id')
                        ->where('model_has_roles.model_type', 'like', '%User');
                })
                ->leftJoin('roles', 'model_has_roles.role_id', '=', 'roles.id')
                ->addSelect(DB::raw('MIN(roles.name) as role'))
                ->groupBy('users.id', 'users.name', 'users.email', 'users.created_at');
            if ($hasPhone) $query->groupBy('users.phone');
            if ($hasIsActive) $query->groupBy('users.is_active');
        }

        $users = $query->orderBy('users.id', 'desc')->get()->map(function ($row) use ($hasPhone, $hasIsActive) {
            return [
                'id' => (int) $row->id,
                'name' => $row->name,
                'phone' => $hasPhone ? ($row->phone ?? '-') : '-',
                'email' => $row->email,
                'role' => $row->role ?? 'admin',
                'status' => $hasIsActive ? ((int) ($row->is_active ?? 1) === 1 ? 'active' : 'inactive') : 'active',
                'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
            ];
        })->values();

        return response()->json(['users' => $users]);
    });

    Route::post('/admin/users', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'max:128'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $tenantDb = DB::connection('center');
        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        if ($tenantDb->table('users')->where('email', $payload['email'])->exists()) {
            return response()->json(['message' => 'Email already exists'], 422);
        }

        $insert = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasPhone) $insert['phone'] = $payload['phone'] ?? null;
        if ($hasIsActive) $insert['is_active'] = ($payload['status'] ?? 'active') === 'active' ? 1 : 0;
        $userId = $tenantDb->table('users')->insertGetId($insert);

        if (
            !empty($payload['role'])
            && Schema::connection('center')->hasTable('roles')
            && Schema::connection('center')->hasTable('model_has_roles')
        ) {
            $role = $tenantDb->table('roles')->where('name', $payload['role'])->first();
            if ($role) {
                $tenantDb->table('model_has_roles')->insert([
                    'role_id' => $role->id,
                    'model_type' => 'App\\Models\\User',
                    'model_id' => $userId,
                ]);
            }
        }

        return response()->json(['id' => (int) $userId], 201);
    });

    Route::put('/admin/users/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['nullable', 'string', 'min:6', 'max:128'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:active,inactive'],
        ]);

        $tenantDb = DB::connection('center');
        $user = $tenantDb->table('users')->where('id', $id)->first();
        if (!$user) return response()->json(['message' => 'User not found'], 404);
        if ($tenantDb->table('users')->where('email', $payload['email'])->where('id', '!=', $id)->exists()) {
            return response()->json(['message' => 'Email already exists'], 422);
        }

        $hasPhone = Schema::connection('center')->hasColumn('users', 'phone');
        $hasIsActive = Schema::connection('center')->hasColumn('users', 'is_active');
        $update = [
            'name' => $payload['name'],
            'email' => $payload['email'],
            'updated_at' => now(),
        ];
        if (!empty($payload['password'])) $update['password'] = Hash::make($payload['password']);
        if ($hasPhone) $update['phone'] = $payload['phone'] ?? null;
        if ($hasIsActive) $update['is_active'] = ($payload['status'] ?? 'active') === 'active' ? 1 : 0;
        $tenantDb->table('users')->where('id', $id)->update($update);

        if (
            Schema::connection('center')->hasTable('roles')
            && Schema::connection('center')->hasTable('model_has_roles')
        ) {
            $modelType = $tenantDb->table('model_has_roles')
                ->where('model_id', $id)
                ->where('model_type', 'like', '%User')
                ->value('model_type') ?? 'App\\Models\\User';
            $tenantDb->table('model_has_roles')
                ->where('model_id', $id)
                ->where('model_type', $modelType)
                ->delete();
            if (!empty($payload['role'])) {
                $role = $tenantDb->table('roles')->where('name', $payload['role'])->first();
                if ($role) {
                    $tenantDb->table('model_has_roles')->insert([
                        'role_id' => $role->id,
                        'model_type' => $modelType,
                        'model_id' => $id,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'User updated']);
    });

    Route::delete('/admin/users/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);
        if ((int) Auth::guard('web')->id() === $id) return response()->json(['message' => 'You cannot delete your own account'], 422);

        $tenantDb = DB::connection('center');
        if (Schema::connection('center')->hasTable('model_has_roles')) {
            $tenantDb->table('model_has_roles')
                ->where('model_id', $id)
                ->where('model_type', 'like', '%User')
                ->delete();
        }
        if (Schema::connection('center')->hasTable('model_has_permissions')) {
            $tenantDb->table('model_has_permissions')
                ->where('model_id', $id)
                ->where('model_type', 'like', '%User')
                ->delete();
        }
        $tenantDb->table('users')->where('id', $id)->delete();
        return response()->json(['message' => 'User deleted']);
    });

    Route::get('/admin/roles', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['roles' => [], 'permissions' => []]);
        }

        $tenantDb = DB::connection('center');
        $hasRolePerms = Schema::connection('center')->hasTable('role_has_permissions');
        $hasPerms = Schema::connection('center')->hasTable('permissions');
        $hasModelRoles = Schema::connection('center')->hasTable('model_has_roles');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');

        $roleSelect = ['id', 'name', 'guard_name'];
        if ($hasRoleDescription) {
            $roleSelect[] = 'description';
        }

        $roles = $tenantDb->table('roles')
            ->select($roleSelect)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($r) use ($tenantDb, $hasRolePerms, $hasPerms, $hasModelRoles) {
                $perms = collect();
                if ($hasRolePerms && $hasPerms) {
                    $perms = $tenantDb->table('role_has_permissions')
                        ->join('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                        ->where('role_has_permissions.role_id', $r->id)
                        ->pluck('permissions.name');
                }
                $usersCount = 0;
                if ($hasModelRoles) {
                    $usersCount = (int) $tenantDb->table('model_has_roles')
                        ->where('role_id', $r->id)
                        ->where('model_type', 'like', '%User')
                        ->distinct('model_id')
                        ->count('model_id');
                }
                return [
                    'id' => (int) $r->id,
                    'name' => $r->name,
                    'guard_name' => $r->guard_name,
                    'description' => $r->description ?? '',
                    'permissions' => $perms->values(),
                    'users_count' => $usersCount,
                ];
            })
            ->values();

        $allPermissions = collect();
        if ($hasPerms) {
            $allPermissions = $tenantDb->table('permissions')->orderBy('name')->pluck('name')->values();
        }

        return response()->json(['roles' => $roles, 'permissions' => $allPermissions]);
    });

    Route::post('/admin/roles', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['message' => 'Roles table not found'], 422);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'guard_name' => ['nullable', 'string', 'max:50'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:150'],
        ]);

        $tenantDb = DB::connection('center');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');
        $guardName = $payload['guard_name'] ?? 'web';
        if ($tenantDb->table('roles')->where('name', $payload['name'])->where('guard_name', $guardName)->exists()) {
            return response()->json(['message' => 'Role already exists'], 422);
        }

        $insert = [
            'name' => $payload['name'],
            'guard_name' => $guardName,
            'created_at' => now(),
            'updated_at' => now(),
        ];
        if ($hasRoleDescription) $insert['description'] = $payload['description'] ?? null;
        $roleId = $tenantDb->table('roles')->insertGetId($insert);

        if (
            !empty($payload['permissions'])
            && Schema::connection('center')->hasTable('permissions')
            && Schema::connection('center')->hasTable('role_has_permissions')
        ) {
            $permIds = $tenantDb->table('permissions')->whereIn('name', $payload['permissions'])->pluck('id');
            foreach ($permIds as $permId) {
                $tenantDb->table('role_has_permissions')->insert([
                    'permission_id' => $permId,
                    'role_id' => $roleId,
                ]);
            }
        }

        return response()->json(['id' => (int) $roleId], 201);
    });

    Route::put('/admin/roles/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['message' => 'Roles table not found'], 422);
        }

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'guard_name' => ['nullable', 'string', 'max:50'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:150'],
        ]);

        $tenantDb = DB::connection('center');
        $hasRoleDescription = Schema::connection('center')->hasColumn('roles', 'description');
        $role = $tenantDb->table('roles')->where('id', $id)->first();
        if (!$role) return response()->json(['message' => 'Role not found'], 404);
        $guardName = $payload['guard_name'] ?? $role->guard_name ?? 'web';
        if ($tenantDb->table('roles')->where('name', $payload['name'])->where('guard_name', $guardName)->where('id', '!=', $id)->exists()) {
            return response()->json(['message' => 'Role already exists'], 422);
        }

        $update = [
            'name' => $payload['name'],
            'guard_name' => $guardName,
            'updated_at' => now(),
        ];
        if ($hasRoleDescription) $update['description'] = $payload['description'] ?? null;
        $tenantDb->table('roles')->where('id', $id)->update($update);

        if (Schema::connection('center')->hasTable('role_has_permissions')) {
            $tenantDb->table('role_has_permissions')->where('role_id', $id)->delete();
            if (!empty($payload['permissions']) && Schema::connection('center')->hasTable('permissions')) {
                $permIds = $tenantDb->table('permissions')->whereIn('name', $payload['permissions'])->pluck('id');
                foreach ($permIds as $permId) {
                    $tenantDb->table('role_has_permissions')->insert([
                        'permission_id' => $permId,
                        'role_id' => $id,
                    ]);
                }
            }
        }

        return response()->json(['message' => 'Role updated']);
    });

    Route::delete('/admin/roles/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);
        if (!Schema::connection('center')->hasTable('roles')) {
            return response()->json(['message' => 'Roles table not found'], 422);
        }

        $tenantDb = DB::connection('center');
        if (Schema::connection('center')->hasTable('model_has_roles')) {
            $tenantDb->table('model_has_roles')->where('role_id', $id)->delete();
        }
        if (Schema::connection('center')->hasTable('role_has_permissions')) {
            $tenantDb->table('role_has_permissions')->where('role_id', $id)->delete();
        }
        $tenantDb->table('roles')->where('id', $id)->delete();
        return response()->json(['message' => 'Role deleted']);
    });

    Route::get('/admin/library', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $items = $tenantDb->table('library')
            ->leftJoin('grades', 'library.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'library.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'library.section_id', '=', 'sections.id')
            ->whereNull('library.deleted_at')
            ->select(
                'library.id',
                'library.title',
                'library.grade_id',
                'library.class_id',
                'library.section_id',
                'library.type',
                'library.notes',
                'library.created_at',
                'grades.grade_name as grade_name',
                'classes.class_name as class_name',
                'sections.section_name as section_name'
            )
            ->orderByDesc('library.id')
            ->get()
            ->map(function ($row) {
                $library = Library::query()->find($row->id);
                $media = collect();
                if ($library) {
                    $media = $library->getMedia('library')->map(function ($m) {
                        return [
                            'id' => (int) $m->id,
                            'name' => $m->name ?: $m->file_name,
                            'file_name' => $m->file_name,
                            'mime_type' => $m->mime_type,
                            'size' => (int) $m->size,
                            'url' => $m->getUrl(),
                        ];
                    })->values();
                }

                return [
                    'id' => (int) $row->id,
                    'title' => $row->title,
                    'grade_id' => (int) $row->grade_id,
                    'class_id' => (int) $row->class_id,
                    'section_id' => (int) $row->section_id,
                    'type' => $row->type ?: 'resource',
                    'notes' => $row->notes ?: '',
                    'grade_name' => $row->grade_name ?: '',
                    'class_name' => $row->class_name ?: '',
                    'section_name' => $row->section_name ?: '',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                    'media' => $media,
                ];
            })
            ->values();

        return response()->json(['library' => $items]);
    });

    Route::post('/admin/library', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:51200'],
        ]);

        $library = new Library();
        $library->title = $payload['title'];
        $library->grade_id = (int) $payload['grade_id'];
        $library->class_id = (int) $payload['class_id'];
        $library->section_id = (int) $payload['section_id'];
        $library->type = $payload['type'];
        $library->notes = $payload['notes'] ?? null;
        $library->save();

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $library->addMedia($file)->toMediaCollection('library');
            }
        }

        return response()->json(['id' => (int) $library->id], 201);
    });

    Route::post('/admin/library/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:textbook,manual,workbook,reference,resource'],
            'notes' => ['nullable', 'string'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:51200'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ]);

        $library = Library::query()->find($id);
        if (!$library) return response()->json(['message' => 'Library item not found'], 404);

        $library->title = $payload['title'];
        $library->grade_id = (int) $payload['grade_id'];
        $library->class_id = (int) $payload['class_id'];
        $library->section_id = (int) $payload['section_id'];
        $library->type = $payload['type'];
        $library->notes = $payload['notes'] ?? null;
        $library->save();

        $removeIds = collect($payload['remove_media_ids'] ?? [])->map(fn ($v) => (int) $v)->filter()->values();
        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', Library::class)
                ->where('model_id', $library->id)
                ->get()
                ->each(fn ($m) => $m->delete());
        }

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $library->addMedia($file)->toMediaCollection('library');
            }
        }

        return response()->json(['message' => 'Library item updated']);
    });

    Route::delete('/admin/library/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $library = Library::query()->find($id);
        if (!$library) return response()->json(['message' => 'Library item not found'], 404);
        $library->clearMediaCollection('library');
        $library->delete();
        return response()->json(['message' => 'Library item deleted']);
    });

    Route::get('/admin/announcements', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $items = $tenantDb->table('announcements')
            ->leftJoin('grades', 'announcements.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'announcements.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'announcements.section_id', '=', 'sections.id')
            ->whereNull('announcements.deleted_at')
            ->select(
                'announcements.id',
                'announcements.grade_id',
                'announcements.class_id',
                'announcements.section_id',
                'announcements.title',
                'announcements.body',
                'announcements.time',
                'announcements.announcement_type',
                'announcements.created_at',
                'grades.grade_name as grade_name',
                'classes.class_name as class_name',
                'sections.section_name as section_name'
            )
            ->orderByDesc('announcements.id')
            ->get()
            ->map(function ($row) {
                $announcement = Announcement::query()->find($row->id);
                $media = collect();
                if ($announcement) {
                    $media = $announcement->getMedia('announcements')->map(function ($m) {
                        return [
                            'id' => (int) $m->id,
                            'name' => $m->name ?: $m->file_name,
                            'file_name' => $m->file_name,
                            'mime_type' => $m->mime_type,
                            'size' => (int) $m->size,
                            'url' => $m->getUrl(),
                        ];
                    })->values();
                }
                return [
                    'id' => (int) $row->id,
                    'grade_id' => (int) $row->grade_id,
                    'class_id' => (int) $row->class_id,
                    'section_id' => (int) $row->section_id,
                    'title' => $row->title,
                    'content' => $row->body,
                    'time' => $row->time ? \Illuminate\Support\Carbon::parse($row->time)->format('Y-m-d\TH:i') : null,
                    'type' => $row->announcement_type ?: 'others',
                    'grade_name' => $row->grade_name ?: '',
                    'class_name' => $row->class_name ?: '',
                    'section_name' => $row->section_name ?: '',
                    'created_at' => optional($row->created_at)->format('Y-m-d') ?? now()->toDateString(),
                    'media' => $media,
                ];
            })
            ->values();

        return response()->json(['announcements' => $items]);
    });

    Route::post('/admin/announcements', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:quiz,exam,others'],
            'time' => ['nullable', 'date'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:51200'],
        ]);

        $announcement = new Announcement();
        $announcement->title = $payload['title'];
        $announcement->body = $payload['content'];
        $announcement->grade_id = (int) $payload['grade_id'];
        $announcement->class_id = (int) $payload['class_id'];
        $announcement->section_id = (int) $payload['section_id'];
        $announcement->announcement_type = $payload['type'];
        $announcement->time = $payload['time'] ?? null;
        $announcement->save();

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $announcement->addMedia($file)->toMediaCollection('announcements');
            }
        }

        $dispatcher = app(NotificationDispatchService::class);
        $announceNotification = new AnnouncementNotification(
            (string) $announcement->title,
            (string) $announcement->body,
            '/student/announcements',
        );
        foreach ($dispatcher->resolveRecipients([
            'audience' => 'both',
            'section_id' => (int) $announcement->section_id,
        ]) as $entry) {
            $dispatcher->dispatch($entry['model'], $announceNotification, true);
        }

        return response()->json(['id' => (int) $announcement->id], 201);
    });

    Route::post('/admin/announcements/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'grade_id' => ['required', 'integer', 'exists:center.grades,id'],
            'class_id' => ['required', 'integer', 'exists:center.classes,id'],
            'section_id' => ['required', 'integer', 'exists:center.sections,id'],
            'type' => ['required', 'in:quiz,exam,others'],
            'time' => ['nullable', 'date'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'max:51200'],
            'remove_media_ids' => ['nullable', 'array'],
            'remove_media_ids.*' => ['integer'],
        ]);

        $announcement = Announcement::query()->find($id);
        if (!$announcement) return response()->json(['message' => 'Announcement not found'], 404);

        $announcement->title = $payload['title'];
        $announcement->body = $payload['content'];
        $announcement->grade_id = (int) $payload['grade_id'];
        $announcement->class_id = (int) $payload['class_id'];
        $announcement->section_id = (int) $payload['section_id'];
        $announcement->announcement_type = $payload['type'];
        $announcement->time = $payload['time'] ?? null;
        $announcement->save();

        $removeIds = collect($payload['remove_media_ids'] ?? [])->map(fn ($v) => (int) $v)->filter()->values();
        if ($removeIds->isNotEmpty()) {
            Media::query()
                ->whereIn('id', $removeIds)
                ->where('model_type', Announcement::class)
                ->where('model_id', $announcement->id)
                ->get()
                ->each(fn ($m) => $m->delete());
        }

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $announcement->addMedia($file)->toMediaCollection('announcements');
            }
        }

        return response()->json(['message' => 'Announcement updated']);
    });

    Route::delete('/admin/announcements/{id}', function (Request $request, int $id) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        $authUserId = Auth::guard('web')->id() ?? $request->session()->get('api_auth_user_id');
        if (!$authUserId) return response()->json(['message' => 'Unauthenticated'], 401);

        $announcement = Announcement::query()->find($id);
        if (!$announcement) return response()->json(['message' => 'Announcement not found'], 404);
        $announcement->clearMediaCollection('announcements');
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    });

    Route::get('/admin/reports', function (Request $request) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::get('/admin/payments/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $feesHasFeeType = Schema::connection('center')->hasColumn('fees', 'fee_type');
        $feesHasLegacyType = Schema::connection('center')->hasColumn('fees', 'Fee_type');
        $feeTypeSelect = $feesHasFeeType
            ? 'fee_type as type'
            : ($feesHasLegacyType ? 'Fee_type as type' : DB::raw("'monthly' as type"));
        $fees = $tenantDb->table('fees')
            ->where('grade_id', $section->grade_id)
            ->where('class_id', $section->class_id)
            ->where('section_id', $section->id)
            ->select('id', 'title', 'amount', 'month', 'year', $feeTypeSelect)
            ->get()
            ->map(fn ($f) => [
                'id' => (int) $f->id,
                'title' => $f->title,
                'amount' => (float) $f->amount,
                'month' => $f->month,
                'year' => $f->year,
                'type' => $f->type,
            ])
            ->values();

        $requestedFeeId = $request->query('fee_id');
        $requestedFeeId = is_numeric($requestedFeeId) ? (int) $requestedFeeId : null;
        $selectedFee = $requestedFeeId
            ? $fees->first(fn ($f) => (int) $f['id'] === $requestedFeeId)
            : null;
        $effectiveFee = $selectedFee ?? $fees->first();

        $defaultFeeId = $effectiveFee['id'] ?? null;
        $defaultMonth = $effectiveFee['month'] ?? strtolower(now()->format('F'));
        $defaultAmount = $effectiveFee['amount'] ?? 0;

        $students = $tenantDb->table('students')
            ->where('section_id', $sectionId)
            ->whereNull('deleted_at')
            ->get(['id', 'name', 'grade_id', 'class_id', 'section_id']);

        $paymentsByStudent = $tenantDb->table('payments')
            ->where('section_id', $sectionId)
            ->when($defaultFeeId, fn ($q) => $q->where('fee_id', $defaultFeeId))
            ->when(!$defaultFeeId, fn ($q) => $q->whereDate('payment_date', $date))
            ->orderByDesc('payment_date')
            ->orderByDesc('id')
            ->get(['id', 'student_id', 'payment_date', 'fee_id', 'payment_status', 'month', 'amount', 'notes'])
            ->unique('student_id')
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($paymentsByStudent, $defaultFeeId, $defaultMonth, $defaultAmount, $date) {
            $p = $paymentsByStudent->get($student->id);
            return [
                'id' => $p?->id ? (int) $p->id : null,
                'student_id' => (int) $student->id,
                'student_name' => $student->name,
                'payment_date' => $p?->payment_date ? \Illuminate\Support\Carbon::parse($p->payment_date)->toDateString() : $date,
                'fee_id' => $p?->fee_id ? (int) $p->fee_id : $defaultFeeId,
                'payment_status' => isset($p->payment_status) ? ((int) $p->payment_status === 1 ? 'paid' : 'unpaid') : 'unpaid',
                'month' => $p?->month ?? $defaultMonth,
                'amount' => isset($p->amount) ? (float) $p->amount : $defaultAmount,
                'notes' => $p?->notes ?? '',
            ];
        })->values();

        return response()->json([
            'date' => $date,
            'section' => [
                'id' => (int) $section->id,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
            ],
            'fees' => $fees,
            'selected_fee_id' => $defaultFeeId,
            'rows' => $rows,
        ]);
    });

    Route::post('/admin/payments/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.id' => ['nullable', 'integer'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.payment_date' => ['nullable', 'date_format:Y-m-d'],
            'rows.*.fee_id' => ['required', 'integer', 'exists:center.fees,id'],
            'rows.*.payment_status' => ['required', 'in:paid,unpaid'],
            'rows.*.month' => ['required', 'string', 'max:20'],
            'rows.*.amount' => ['nullable', 'numeric', 'min:0'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);

        $tenantDb = DB::connection('center');
        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        foreach ($payload['rows'] as $row) {
            $student = $students->get($row['student_id']);
            if (!$student || (int) $student->section_id !== $sectionId) continue;
            $rowPaymentDate = $row['payment_date'] ?? $date;
            $rowId = isset($row['id']) && is_numeric($row['id']) ? (int) $row['id'] : null;

            $exists = false;
            if ($rowId) {
                $exists = $tenantDb->table('payments')
                    ->where('id', $rowId)
                    ->where('section_id', $sectionId)
                    ->where('student_id', $row['student_id'])
                    ->exists();
            } else {
                $exists = $tenantDb->table('payments')
                    ->where('section_id', $sectionId)
                    ->where('student_id', $row['student_id'])
                    ->whereDate('payment_date', $rowPaymentDate)
                    ->where('fee_id', (int) $row['fee_id'])
                    ->exists();
            }

            $data = [
                'payment_date' => $rowPaymentDate,
                'student_id' => (int) $row['student_id'],
                'grade_id' => (int) $student->grade_id,
                'class_id' => (int) $student->class_id,
                'section_id' => (int) $student->section_id,
                'fee_id' => (int) $row['fee_id'],
                'payment_status' => $row['payment_status'] === 'paid' ? 1 : 0,
                'month' => $row['month'],
                'amount' => $row['amount'] ?? null,
                'notes' => $row['notes'] ?? null,
                'updated_at' => now(),
            ];

            if ($exists) {
                if ($rowId) {
                    $tenantDb->table('payments')
                        ->where('id', $rowId)
                        ->where('section_id', $sectionId)
                        ->where('student_id', $row['student_id'])
                        ->update($data);
                } else {
                    $tenantDb->table('payments')
                        ->where('section_id', $sectionId)
                        ->where('student_id', $row['student_id'])
                        ->whereDate('payment_date', $rowPaymentDate)
                        ->where('fee_id', (int) $row['fee_id'])
                        ->update($data);
                }
            } else {
                $data['created_at'] = now();
                $tenantDb->table('payments')->insert($data);
            }
        }

        return response()->json(['message' => 'Payments saved']);
    });

    Route::get('/admin/payments/section/{sectionId}/history', function (Request $request, int $sectionId) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $days = DB::connection('center')->table('payments')
            ->where('section_id', $sectionId)
            ->select(
                DB::raw('DATE(payment_date) as date'),
                DB::raw('SUM(CASE WHEN payment_status = 1 THEN 1 ELSE 0 END) as paid'),
                DB::raw('SUM(CASE WHEN payment_status = 0 THEN 1 ELSE 0 END) as unpaid'),
                DB::raw('SUM(COALESCE(amount,0)) as total_amount'),
                DB::raw('COUNT(*) as total')
            )
            ->groupBy(DB::raw('DATE(payment_date)'))
            ->orderByDesc(DB::raw('DATE(payment_date)'))
            ->get()
            ->map(fn ($d) => [
                'date' => $d->date,
                'paid' => (int) $d->paid,
                'unpaid' => (int) $d->unpaid,
                'total_amount' => (float) $d->total_amount,
                'total' => (int) $d->total,
            ])
            ->values();

        return response()->json(['days' => $days]);
    });

    Route::get('/admin/exams/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);
        $students = $tenantDb->table('students')->where('section_id', $sectionId)->whereNull('deleted_at')->get(['id', 'name']);
        $examHasAttendance = Schema::connection('center')->hasColumn('exam_degrees', 'attendance_status');
        $examCols = ['student_id', 'degree', 'notes'];
        if ($examHasAttendance) $examCols[] = 'attendance_status';
        $records = $tenantDb->table('exam_degrees')->where('section_id', $sectionId)->whereDate('exam_date', $date)->get($examCols)->keyBy('student_id');
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
        return response()->json(['date' => $date, 'section' => ['id' => (int) $section->id, 'grade_id' => (int) $section->grade_id, 'class_id' => (int) $section->class_id], 'rows' => $rows]);
    });

    Route::get('/admin/exams/section/{sectionId}/history', function (Request $request, int $sectionId) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);
        $days = DB::connection('center')->table('exam_degrees')
            ->where('section_id', $sectionId)
            ->select(DB::raw('DATE(exam_date) as date'), DB::raw('COUNT(*) as students_count'))
            ->groupBy(DB::raw('DATE(exam_date)'))
            ->orderByDesc(DB::raw('DATE(exam_date)'))
            ->get()
            ->map(fn ($d) => ['date' => $d->date, 'exam_name' => 'Exam', 'students_count' => (int) $d->students_count])
            ->values();
        return response()->json(['days' => $days]);
    });

    Route::post('/admin/exams/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);
        $payload = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.status' => ['required', 'in:present,absent,late'],
            'rows.*.degree' => ['nullable', 'string', 'max:10'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);
        $tenantDb = DB::connection('center');
        $examHasAttendance = Schema::connection('center')->hasColumn('exam_degrees', 'attendance_status');
        $students = $tenantDb->table('students')->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())->get(['id', 'grade_id', 'class_id', 'section_id'])->keyBy('id');
        foreach ($payload['rows'] as $row) {
            $s = $students->get($row['student_id']);
            if (!$s || (int) $s->section_id !== $sectionId) continue;
            $exists = $tenantDb->table('exam_degrees')->where('student_id', $row['student_id'])->whereDate('exam_date', $date)->exists();
            $data = [
                'student_id' => (int) $row['student_id'],
                'grade_id' => (int) $s->grade_id,
                'class_id' => (int) $s->class_id,
                'section_id' => (int) $s->section_id,
                'exam_date' => $date,
                'degree' => $row['status'] === 'absent' ? '' : (string) ($row['degree'] ?? '0'),
                'notes' => $row['notes'] ?? null,
                'updated_at' => now(),
            ];
            if ($examHasAttendance) {
                $data['attendance_status'] = $row['status'];
            }
            if ($exists) {
                $tenantDb->table('exam_degrees')->where('student_id', $row['student_id'])->whereDate('exam_date', $date)->update($data);
            } else {
                $data['created_at'] = now();
                $tenantDb->table('exam_degrees')->insert($data);
            }
        }
        return response()->json(['message' => 'Exam results saved']);
    });

    Route::get('/admin/quizzes/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);
        $students = $tenantDb->table('students')->where('section_id', $sectionId)->whereNull('deleted_at')->get(['id', 'name']);
        $quizHasAttendance = Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status');
        $quizCols = ['student_id', 'degree', 'notes'];
        if ($quizHasAttendance) $quizCols[] = 'attendance_status';
        $records = $tenantDb->table('quiz_degrees')->where('section_id', $sectionId)->whereDate('quiz_date', $date)->get($quizCols)->keyBy('student_id');
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
        return response()->json(['date' => $date, 'section' => ['id' => (int) $section->id, 'grade_id' => (int) $section->grade_id, 'class_id' => (int) $section->class_id], 'rows' => $rows]);
    });

    Route::get('/admin/quizzes/section/{sectionId}/history', function (Request $request, int $sectionId) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::post('/admin/quizzes/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) return response()->json(['message' => 'Invalid date format'], 422);
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);
        $payload = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.status' => ['required', 'in:present,absent,late'],
            'rows.*.degree' => ['nullable', 'string', 'max:10'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);
        $tenantDb = DB::connection('center');
        $quizHasAttendance = Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status');
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
            if ($exists) {
                $tenantDb->table('quiz_degrees')->where('student_id', $row['student_id'])->whereDate('quiz_date', $date)->update($data);
            } else {
                $data['created_at'] = now();
                $tenantDb->table('quiz_degrees')->insert($data);
            }
        }
        return response()->json(['message' => 'Quiz results saved']);
    });

    Route::get('/admin/attendance/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['message' => 'Invalid date format'], 422);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $students = $tenantDb->table('students')
            ->where('section_id', $sectionId)
            ->whereNull('deleted_at')
            ->get(['id', 'name', 'grade_id', 'class_id', 'section_id']);

        $attendanceByStudent = $tenantDb->table('attendances')
            ->where('section_id', $sectionId)
            ->whereDate('attendance_date', $date)
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

        return response()->json([
            'date' => $date,
            'section' => [
                'id' => (int) $section->id,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
            ],
            'rows' => $rows,
        ]);
    });

    Route::get('/admin/attendance/section/{sectionId}/history', function (Request $request, int $sectionId) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
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
    });

    Route::post('/admin/attendance/section/{sectionId}/date/{date}', function (Request $request, int $sectionId, string $date) use ($resolveTenantBySlug, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        if ($guard !== 'web') return response()->json(['message' => 'Forbidden'], 403);

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return response()->json(['message' => 'Invalid date format'], 422);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = $resolveTenant($tenantId, $tenantSlug);
        if (!$tenant) return response()->json(['message' => 'Tenant not found'], 422);
        $ensureTenantInitialized($tenant);
        if (!Auth::guard('web')->check()) return response()->json(['message' => 'Unauthenticated'], 401);

        $payload = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.student_id' => ['required', 'integer', 'exists:center.students,id'],
            'rows.*.status' => ['required', 'in:present,absent,late'],
            'rows.*.notes' => ['nullable', 'string'],
        ]);

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')->where('id', $sectionId)->first();
        if (!$section) return response()->json(['message' => 'Section not found'], 404);

        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        $statusMap = ['present' => 1, 'absent' => 0, 'late' => 2];

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
    });

    Route::post('/login', function (Request $request) use ($guardMap, $roleMap, $tenantGuards) {
        return app(AuthLoginHandler::class)->login($request, $guardMap, $roleMap, $tenantGuards);
    });

    Route::get('/auth/memberships', function (Request $request) use ($guardMap) {
        return app(AuthLoginHandler::class)->listMemberships($request, $guardMap);
    });

    Route::post('/auth/switch-tenant', function (Request $request) use ($guardMap, $roleMap) {
        return app(AuthLoginHandler::class)->switchCenter($request, $guardMap, $roleMap);
    });

    Route::post('/auth/switch-center', function (Request $request) use ($guardMap, $roleMap) {
        return app(AuthLoginHandler::class)->switchCenter($request, $guardMap, $roleMap);
    });

    Route::post('/logout', function (Request $request) use ($tenantGuards, $ensureTenantInitialized, $centralConnection, $resolveTenant) {
        ApiBearerAuth::revoke($request->bearerToken());

        $guard = $request->session()->get('api_auth_guard', 'web');
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug');

        if (in_array($guard, $tenantGuards, true)) {
            $tenant = $resolveTenant($tenantId, $tenantSlug);
            if ($tenant) {
                $ensureTenantInitialized($tenant);
            }
        }

        Auth::guard($guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out']);
    });

    Route::get('/user', function (Request $request) use ($tenantGuards, $roleMap, $resolveTenant, $ensureTenantInitialized, $centralConnection) {
        $guard = $request->session()->get('api_auth_guard', 'web');
        $bearer = ApiBearerAuth::resolve($request);

        if ($bearer) {
            $guard = $bearer['guard'];
            if (! empty($bearer['portal'])) {
                $request->session()->put('api_portal_mode', true);
                $request->session()->put('api_auth_guard', $bearer['guard']);
                if (! empty($bearer['profile_email'])) {
                    $request->session()->put('api_profile_email', $bearer['profile_email']);
                }
                if (! empty($bearer['user_type'])) {
                    $request->session()->put('api_profile_user_type', $bearer['user_type']);
                }
            } elseif (! empty($bearer['profile_email'])) {
                $request->session()->put('api_profile_email', $bearer['profile_email']);
                if (! empty($bearer['user_type'])) {
                    $request->session()->put('api_profile_user_type', $bearer['user_type']);
                }
            }
        }

        if ($request->session()->get('api_portal_mode') || ($bearer['portal'] ?? false)) {
            $email = $request->session()->get('api_profile_email') ?: ($bearer['profile_email'] ?? null);
            $userType = $request->session()->get('api_profile_user_type') ?: ($bearer['user_type'] ?? null);
            if (! $email || ! $userType) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $identityName = $email;
            $profiles = DB::connection('center')->table(
                $userType === Student::class ? 'students' : 'parents'
            )->where('email', $email)->first();
            if ($profiles) {
                $identityName = $userType === Student::class
                    ? (string) ($profiles->name ?? $email)
                    : (string) ($profiles->parent_name ?? $email);
            }

            return response()->json([
                'user' => [
                    'id' => 0,
                    'name' => $identityName,
                    'email' => $email,
                    'role' => $roleMap[$guard] ?? $guard,
                    'locale' => app()->getLocale(),
                    'created_at' => now()->toDateString(),
                    'portal_mode' => true,
                    'tenant_id' => null,
                    'tenant_slug' => null,
                    'tenant_name' => null,
                ],
            ]);
        }

        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug') ?? $request->header('X-Tenant-Slug') ?? $request->query('tenant_slug');
        $tenant = null;

        if ($bearer) {
            $tenantId = $bearer['tenant_id'] ?: $tenantId;
            $tenantSlug = $bearer['tenant_slug'] ?: $tenantSlug;
        }

        if (in_array($guard, $tenantGuards, true) && ($tenantId || $tenantSlug)) {
            $tenant = $resolveTenant($tenantId, $tenantSlug);
            if ($tenant) {
                $ensureTenantInitialized($tenant);
            }
        }

        if (! Auth::guard($guard)->check()) {
            if ($bearer) {
                Auth::guard($guard)->loginUsingId($bearer['user_id']);
            }
        }

        if (! Auth::guard($guard)->check()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $user = Auth::guard($guard)->user();

        $tenantName = $tenant
            ? optional($tenant)->name
            : null;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name ?? $user->parent_name ?? 'User',
                'email' => $user->email,
                'role' => $roleMap[$guard] ?? 'admin',
                'locale' => app()->getLocale(),
                'created_at' => optional($user->created_at)->toDateString() ?? now()->toDateString(),
                'tenant_id' => $tenant?->id,
                'tenant_slug' => $tenantSlug,
                'tenant_name' => $tenantName,
            ],
        ]);
    });

    // Landing Pages
    Route::get('/admin/landing-pages', [LandingPageApiController::class, 'index']);
    Route::post('/admin/landing-pages', [LandingPageApiController::class, 'store']);
    Route::get('/admin/landing-pages/templates', fn () => response()->json(['templates' => []]));
    Route::post('/admin/landing-pages/from-template', [LandingPageApiController::class, 'store']);
    Route::post('/admin/landing-pages/from-teacher', [LandingPageApiController::class, 'fromTeacher']);
    Route::get('/admin/landing-pages/media', [LandingPageApiController::class, 'mediaIndex']);
    Route::post('/admin/landing-pages/media', [LandingPageApiController::class, 'mediaStore']);
    Route::delete('/admin/landing-pages/media/{id}', [LandingPageApiController::class, 'mediaDestroy']);
    Route::get('/admin/landing-pages/{id}', [LandingPageApiController::class, 'show'])->whereNumber('id');
    Route::put('/admin/landing-pages/{id}', [LandingPageApiController::class, 'update'])->whereNumber('id');
    Route::delete('/admin/landing-pages/{id}', [LandingPageApiController::class, 'destroy'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/publish', [LandingPageApiController::class, 'publish'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/unpublish', [LandingPageApiController::class, 'unpublish'])->whereNumber('id');
    Route::post('/admin/landing-pages/{id}/duplicate', [LandingPageApiController::class, 'duplicate'])->whereNumber('id');
    Route::get('/admin/landing-pages/{pageId}/revisions', [LandingPageApiController::class, 'revisions'])->whereNumber('pageId');
    Route::post('/admin/landing-pages/{pageId}/revisions/{revisionId}/restore', [LandingPageApiController::class, 'restoreRevision'])->whereNumber(['pageId', 'revisionId']);
    Route::get('/admin/landing-pages/{pageId}/analytics', [LandingPageApiController::class, 'analytics'])->whereNumber('pageId');
    Route::get('/public/landing/{slug}', [LandingPageApiController::class, 'publicShow'])->where('slug', '.+');
});
