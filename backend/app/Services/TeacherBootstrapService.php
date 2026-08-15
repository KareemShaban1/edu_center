<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Library;
use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class TeacherBootstrapService
{
    public function __construct(
        private readonly TeacherSectionService $teacherSectionService,
    ) {}

    /**
     * @return array{classes: Collection, attendance: Collection, exams: Collection, quizzes: Collection, homework: Collection, library: Collection}
     */
    public function build(Connection $tenantDb, int $teacherId): array
    {
        $sectionIds = $this->teacherSectionService->sectionIds($tenantDb, $teacherId);

        return [
            'classes' => $this->classes($tenantDb, $sectionIds),
            'attendance' => $this->attendance($tenantDb, $sectionIds),
            'exams' => $this->exams($tenantDb, $sectionIds),
            'quizzes' => $this->quizzes($tenantDb, $sectionIds),
            'homework' => $this->homework($tenantDb, $sectionIds),
            'library' => $this->library($tenantDb, $sectionIds),
        ];
    }

    private function classes(Connection $tenantDb, Collection $sectionIds): Collection
    {
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
                        'grade_id' => (int) $row->grade_id,
                        'class_id' => (int) $row->class_id,
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

        return $classes;
    }

    private function attendance(Connection $tenantDb, Collection $sectionIds): Collection
    {
        $attendance = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('attendances') && Schema::connection('center')->hasTable('students')) {
            $attendance = $tenantDb->table('attendances')
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->leftJoin('sections', 'attendances.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'attendances.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'attendances.grade_id', '=', 'grades.id')
                ->whereIn('attendances.section_id', $sectionIds)
                ->orderByDesc('attendances.attendance_date')
                ->limit(300)
                ->get([
                    'attendances.id',
                    'attendances.student_id',
                    'attendances.attendance_date',
                    'attendances.attendance_status',
                    'attendances.grade_id',
                    'attendances.class_id',
                    'attendances.section_id',
                    'students.name',
                    'grades.grade_name',
                    'classes.class_name',
                    'sections.section_name',
                ])
                ->map(function ($row) {
                    $status = ((int) $row->attendance_status) === 1 ? 'present' : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');

                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'grade_id' => (int) $row->grade_id,
                        'class_id' => (int) $row->class_id,
                        'section_id' => (int) $row->section_id,
                        'grade' => $row->grade_name ?? '',
                        'class' => $row->class_name ?? '',
                        'section' => $row->section_name ?? '',
                        'date' => $row->attendance_date,
                        'status' => $status,
                        'student' => ['name' => $row->name],
                    ];
                })
                ->values();
        }

        return $attendance;
    }

    private function quizzes(Connection $tenantDb, Collection $sectionIds): Collection
    {
        $quizzes = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('quiz_degrees')) {
            $quizzes = $tenantDb->table('quiz_degrees')
                ->leftJoin('students', 'quiz_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'quiz_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'quiz_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'quiz_degrees.grade_id', '=', 'grades.id')
                ->whereIn('quiz_degrees.section_id', $sectionIds)
                ->select(
                    'quiz_degrees.id',
                    'quiz_degrees.quiz_date',
                    'quiz_degrees.degree',
                    'quiz_degrees.notes',
                    'quiz_degrees.attendance_status',
                    'quiz_degrees.grade_id',
                    'quiz_degrees.class_id',
                    'quiz_degrees.section_id',
                    'students.name as student_name',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name'
                )
                ->orderByDesc('quiz_degrees.quiz_date')
                ->limit(200)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => 'Quiz ' . $row->quiz_date,
                        'subject' => 'General',
                        'grade_id' => (int) ($row->grade_id ?? 0),
                        'class_id' => (int) ($row->class_id ?? 0),
                        'section_id' => (int) ($row->section_id ?? 0),
                        'grade' => $row->grade_name ?? '',
                        'class' => $row->class_name ?? '',
                        'section' => $row->section_name ?? '',
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

        return $quizzes;
    }

    private function exams(Connection $tenantDb, Collection $sectionIds): Collection
    {
        $exams = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('exam_degrees')) {
            $exams = $tenantDb->table('exam_degrees')
                ->leftJoin('students', 'exam_degrees.student_id', '=', 'students.id')
                ->leftJoin('sections', 'exam_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'exam_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'exam_degrees.grade_id', '=', 'grades.id')
                ->whereIn('exam_degrees.section_id', $sectionIds)
                ->select(
                    'exam_degrees.id',
                    'exam_degrees.exam_date',
                    'exam_degrees.degree',
                    'exam_degrees.notes',
                    'exam_degrees.attendance_status',
                    'exam_degrees.grade_id',
                    'exam_degrees.class_id',
                    'exam_degrees.section_id',
                    'students.name as student_name',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name'
                )
                ->orderByDesc('exam_degrees.exam_date')
                ->limit(200)
                ->get()
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'name' => 'Exam ' . $row->exam_date,
                        'subject' => 'General',
                        'grade_id' => (int) ($row->grade_id ?? 0),
                        'class_id' => (int) ($row->class_id ?? 0),
                        'section_id' => (int) ($row->section_id ?? 0),
                        'grade' => $row->grade_name ?? '',
                        'class' => $row->class_name ?? '',
                        'section' => $row->section_name ?? '',
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

        return $exams;
    }

    private function homework(Connection $tenantDb, Collection $sectionIds): Collection
    {
        $homework = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('homeworks')) {
            $homework = $tenantDb->table('homeworks')
                ->leftJoin('sections', 'homeworks.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'homeworks.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'homeworks.grade_id', '=', 'grades.id')
                ->whereIn('homeworks.section_id', $sectionIds)
                ->orderByDesc('homeworks.due_date')
                ->limit(200)
                ->get([
                    'homeworks.id',
                    'homeworks.title',
                    'homeworks.due_date',
                    'homeworks.grade_id',
                    'homeworks.class_id',
                    'homeworks.section_id',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                ])
                ->map(function ($row) {
                    return [
                        'id' => (int) $row->id,
                        'title' => $row->title,
                        'subject' => 'General',
                        'grade_id' => (int) ($row->grade_id ?? 0),
                        'class_id' => (int) ($row->class_id ?? 0),
                        'section_id' => (int) ($row->section_id ?? 0),
                        'grade' => $row->grade_name ?? '',
                        'class' => $row->class_name ?? '',
                        'section' => $row->section_name ?? '',
                        'due_date' => $row->due_date,
                        'submissions' => 0,
                    ];
                })
                ->values();
        }

        return $homework;
    }

    private function library(Connection $tenantDb, Collection $sectionIds): Collection
    {
        $library = collect();
        if ($sectionIds->isNotEmpty() && Schema::connection('center')->hasTable('library')) {
            $library = $tenantDb->table('library')
                ->leftJoin('grades', 'library.grade_id', '=', 'grades.id')
                ->leftJoin('classes', 'library.class_id', '=', 'classes.id')
                ->leftJoin('sections', 'library.section_id', '=', 'sections.id')
                ->whereIn('library.section_id', $sectionIds)
                ->whereNull('library.deleted_at')
                ->orderByDesc('library.id')
                ->limit(200)
                ->get([
                    'library.id',
                    'library.title',
                    'library.type',
                    'library.grade_id',
                    'library.class_id',
                    'library.section_id',
                    'library.created_at',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                ])
                ->map(function ($row) {
                    $book = Library::query()->find($row->id);
                    $firstMediaUrl = $book?->getFirstMediaUrl('library') ?: null;

                    return [
                        'id' => (int) $row->id,
                        'title' => $row->title,
                        'type' => $row->type ?: 'resource',
                        'grade_id' => (int) ($row->grade_id ?? 0),
                        'class_id' => (int) ($row->class_id ?? 0),
                        'section_id' => (int) ($row->section_id ?? 0),
                        'grade' => $row->grade_name ?: '',
                        'class' => $row->class_name ?: '',
                        'section' => $row->section_name ?: '',
                        'date' => $row->created_at ? (string) $row->created_at : '',
                        'url' => $firstMediaUrl,
                    ];
                })
                ->values();
        }

        return $library;
    }
}
