<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Resources\MediaResource;
use App\Http\Support\SectionWeekDays;
use App\Models\Lesson;
use App\Models\Platform\Center;
use App\Models\Teacher;
use App\Models\Unit;
use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class AdminBootstrapService
{
    /**
     * @return array<string, mixed>
     */
    public function build(Connection $tenantDb, Center $tenant, ?string $tenantSlug): array
    {
        $studentsHasIsActive = Schema::connection('center')->hasColumn('students', 'is_active');
        $teachersHasIsActive = Schema::connection('center')->hasColumn('teachers', 'is_active');
        $parentsHasIsActive = Schema::connection('center')->hasColumn('parents', 'is_active');

        $grades = $tenantDb->table('grades')
            ->select('id', 'grade_name as name', 'notes')
            ->get();

        $classesHasNotes = Schema::connection('center')->hasColumn('classes', 'notes');
        $classes = $tenantDb->table('classes')
            ->select(
                'id',
                'class_name as name',
                'grade_id',
                $classesHasNotes ? 'notes' : DB::raw('NULL as notes'),
            )
            ->get();

        $sectionHasTeacherId = Schema::connection('center')->hasColumn('sections', 'teacher_id');
        $sectionHasWeekDays = Schema::connection('center')->hasColumn('sections', 'week_days');
        $relatedSectionIds = $this->sectionIdsWithRelatedRecords($tenantDb);
        $sections = $tenantDb->table('sections')
            ->select(
                'id',
                'section_name as name',
                'class_id',
                'grade_id',
                $sectionHasTeacherId ? 'teacher_id' : DB::raw('NULL as teacher_id'),
                $sectionHasWeekDays ? 'week_days' : DB::raw('NULL as week_days'),
            )
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) use ($relatedSectionIds) {
                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'class_id' => $row->class_id,
                    'grade_id' => $row->grade_id,
                    'teacher_id' => $row->teacher_id,
                    'week_days' => SectionWeekDays::decode($row->week_days ?? null),
                    'has_related' => $relatedSectionIds->contains((int) $row->id),
                ];
            });

        $students = $this->students($tenantDb, $studentsHasIsActive);
        $teachers = $this->teachers($tenantDb, $teachersHasIsActive);

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

            if (! $sectionHasTeacherId) {
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

        $parents = $this->parents($tenantDb, $parentsHasIsActive);
        $attendances = $tenantDb->table('attendances')
            ->select('id', 'student_id', 'attendance_date as date', 'attendance_status as status')
            ->get();

        $fees = $this->fees($tenantDb);
        $units = $this->units($tenantDb);
        $lessons = $this->lessons($tenantDb);
        $homeworks = $this->homeworks($tenantDb);
        $library = $this->library($tenantDb);
        $announcements = $this->announcements($tenantDb);
        $users = $this->users($tenantDb);
        $roles = $this->roles($tenantDb);

        return [
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
        ];
    }

    private function students(Connection $tenantDb, bool $studentsHasIsActive): Collection
    {
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

        return $studentsQuery
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
    }

    private function teachers(Connection $tenantDb, bool $teachersHasIsActive): Collection
    {
        $teacherColumns = ['id', 'name', 'email', 'subject as specialization', 'phone', 'gender', 'joining_date'];
        if ($teachersHasIsActive) {
            $teacherColumns[] = 'is_active';
        }

        $rows = $tenantDb->table('teachers')
            ->select($teacherColumns)
            ->get();

        $collection = (string) config('media.collections.teachers');
        $models = Teacher::query()
            ->with('media')
            ->whereIn('id', $rows->pluck('id'))
            ->get()
            ->keyBy('id');

        return $rows->map(function ($row) use ($models, $collection) {
            $teacher = $models->get($row->id);
            $media = $teacher
                ? MediaResource::collection($teacher->getMedia($collection))->resolve()
                : [];

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
                'media' => $media,
            ];
        });
    }

    private function parents(Connection $tenantDb, bool $parentsHasIsActive): Collection
    {
        $parentColumns = ['id', 'parent_name', 'email', 'parent_phone', 'parent_job', 'parent_address', 'created_at'];
        if ($parentsHasIsActive) {
            $parentColumns[] = 'is_active';
        }

        return $tenantDb->table('parents')
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
    }

    private function fees(Connection $tenantDb): Collection
    {
        $feesHasFeeType = Schema::connection('center')->hasColumn('fees', 'fee_type');
        $feesHasLegacyType = Schema::connection('center')->hasColumn('fees', 'Fee_type');
        $feeTypeSelect = $feesHasFeeType
            ? 'fee_type as type'
            : ($feesHasLegacyType ? 'Fee_type as type' : DB::raw("'monthly' as type"));

        $paymentCounts = Schema::connection('center')->hasTable('payments')
            ? $tenantDb->table('payments')
                ->select('fee_id', DB::raw('COUNT(*) as payments_count'))
                ->groupBy('fee_id')
                ->pluck('payments_count', 'fee_id')
            : collect();

        return $tenantDb->table('fees')
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
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) use ($paymentCounts) {
                $count = (int) ($paymentCounts[$row->id] ?? 0);

                return [
                    'id' => (int) $row->id,
                    'title' => $row->title,
                    'amount' => (float) $row->amount,
                    'grade_id' => (int) $row->grade_id,
                    'classroom_id' => (int) $row->classroom_id,
                    'section_id' => (int) $row->section_id,
                    'description' => $row->description,
                    'year' => $row->year ?? '',
                    'month' => $row->month,
                    'type' => $row->type ?? 'monthly',
                    'has_payments' => $count > 0,
                    'payments_count' => $count,
                ];
            });
    }

    private function units(Connection $tenantDb): Collection
    {
        return $tenantDb->table('units')
            ->select('id', 'name', 'class_id', 'notes')
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) {
                $unit = Unit::query()->find($row->id);
                $media = collect();
                if ($unit) {
                    $media = MediaResource::collection($unit->getMedia('units'))->resolve();
                }

                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'class_id' => $row->class_id,
                    'notes' => $row->notes,
                    'media' => $media,
                ];
            });
    }

    private function lessons(Connection $tenantDb): Collection
    {
        return $tenantDb->table('lessons')
            ->select('id', 'name', 'unit_id', 'notes')
            ->orderByDesc('id')
            ->get()
            ->map(function ($row) {
                $lesson = Lesson::query()->find($row->id);
                $media = collect();
                if ($lesson) {
                    $media = MediaResource::collection($lesson->getMedia('lessons'))->resolve();
                }

                return [
                    'id' => $row->id,
                    'name' => $row->name,
                    'unit_id' => $row->unit_id,
                    'notes' => $row->notes,
                    'media' => $media,
                ];
            });
    }

    private function homeworks(Connection $tenantDb): Collection
    {
        $homeworks = $tenantDb->table('homeworks')
            ->select('id', 'title', 'content', 'grade_id', 'class_id', 'section_id', 'submit_date as start_date', 'due_date')
            ->orderByDesc('id')
            ->get();

        $submissionCounts = collect();
        if (Schema::connection('center')->hasTable('student_homework')) {
            $submissionCounts = $tenantDb->table('student_homework')
                ->select('homework_id', DB::raw('COUNT(*) as cnt'))
                ->groupBy('homework_id')
                ->pluck('cnt', 'homework_id');
        }

        return $homeworks->map(function ($row) use ($submissionCounts) {
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
    }

    private function library(Connection $tenantDb): Collection
    {
        return $tenantDb->table('library')
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
    }

    private function announcements(Connection $tenantDb): Collection
    {
        return $tenantDb->table('announcements')
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
    }

    private function users(Connection $tenantDb): Collection
    {
        return $tenantDb->table('users')
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
    }

    private function roles(Connection $tenantDb): Collection
    {
        if (! Schema::connection('center')->hasTable('roles') || ! Schema::connection('center')->hasTable('model_has_roles')) {
            return collect();
        }

        return $tenantDb->table('roles')
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

    /**
     * @return Collection<int, int>
     */
    private function sectionIdsWithRelatedRecords(Connection $tenantDb): Collection
    {
        $ids = collect();
        $tables = [
            'students',
            'sessions',
            'attendances',
            'homeworks',
            'library',
            'fees',
            'payments',
            'exam_degrees',
            'quiz_degrees',
            'announcements',
            'online_classes',
            'student_certifications',
        ];

        foreach ($tables as $table) {
            if (! Schema::connection('center')->hasTable($table)) {
                continue;
            }
            if (! Schema::connection('center')->hasColumn($table, 'section_id')) {
                continue;
            }

            $ids = $ids->merge(
                $tenantDb->table($table)
                    ->whereNotNull('section_id')
                    ->distinct()
                    ->pluck('section_id')
            );
        }

        return $ids->map(static fn ($id) => (int) $id)->unique()->values();
    }
}