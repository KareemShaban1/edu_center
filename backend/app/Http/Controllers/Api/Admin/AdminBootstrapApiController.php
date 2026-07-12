<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Support\ApiGuardMaps;
use App\Http\Support\ResolvesAdminApiContext;
use App\Http\Support\SectionWeekDays;
use App\Models\Lesson;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class AdminBootstrapApiController extends Controller
{
    use ResolvesAdminApiContext;
    public function show(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'web');
        $tenantId = $request->session()->get('api_tenant_id');
        $tenantSlug = $request->session()->get('api_tenant_slug')
            ?? $request->header('X-Tenant-Slug')
            ?? $request->query('tenant_slug');

        if (!in_array($guard, ApiGuardMaps::TENANT_GUARDS, true)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $tenant = $this->resolveCenter($tenantId, $tenantSlug);
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 422);
        }

        $this->ensureTenantInitialized($tenant);

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
            ->get()
            ->map(function ($row) {
                $unit = Unit::query()->find($row->id);
                $media = collect();
                if ($unit) {
                    $media = $unit->getMedia('units')->map(function ($m) {
                        return [
                            'id' => (int) $m->id,
                            'name' => $m->name ?: $m->file_name,
                            'file_name' => $m->file_name,
                            'mime_type' => $m->mime_type,
                            'size' => (int) $m->size,
                            'type' => $m->mime_type ?: 'application/octet-stream',
                            'url' => $m->getUrl(),
                        ];
                    })->values();
                }

                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'class_id' => $row->class_id,
                    'notes' => $row->notes,
                    'media' => $media,
                ];
            });

        $lessons = $tenantDb->table('lessons')
            ->select('id', 'name', 'unit_id', 'notes')
            ->get()
            ->map(function ($row) {
                $lesson = Lesson::query()->find($row->id);
                $media = collect();
                if ($lesson) {
                    $media = $lesson->getMedia('lessons')->map(function ($m) {
                        return [
                            'id' => (int) $m->id,
                            'name' => $m->name ?: $m->file_name,
                            'file_name' => $m->file_name,
                            'mime_type' => $m->mime_type,
                            'size' => (int) $m->size,
                            'type' => $m->mime_type ?: 'application/octet-stream',
                            'url' => $m->getUrl(),
                        ];
                    })->values();
                }

                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'unit_id' => $row->unit_id,
                    'notes' => $row->notes,
                    'media' => $media,
                ];
            });

        $homeworks = $tenantDb->table('homeworks')
            ->select('id', 'title', 'content', 'grade_id', 'class_id', 'section_id', 'submit_date as start_date', 'due_date')
            ->get();
        $submissionCounts = collect();
        if (Schema::connection('center')->hasTable('student_homework')) {
            $submissionCounts = $tenantDb->table('student_homework')
                ->select('homework_id', DB::raw('COUNT(*) as cnt'))
                ->groupBy('homework_id')
                ->pluck('cnt', 'homework_id');
        }
        $homeworks = $homeworks->map(function ($row) use ($submissionCounts) {
                return [
                    'id' => $row->id,
                    'title' => $row->title,
                    'content' => $row->content,
                    'grade_id' => $row->grade_id,
                    'classroom_id' => $row->class_id,
                    'section_id' => $row->section_id,
                    'start_date' => $row->start_date,
                    'due_date' => $row->due_date,
                    'submissions_count' => (int) ($submissionCounts[$row->id] ?? 0),
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
    }

}
