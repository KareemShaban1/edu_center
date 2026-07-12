<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Support\ResolvesTeacherApiContext;
use App\Models\Library;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class TeacherBootstrapApiController extends Controller
{
    use ResolvesTeacherApiContext;
    public function show(Request $request): JsonResponse
    {
$guard = $request->session()->get('api_auth_guard', 'teacher');
        if ($guard !== 'teacher') {
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

        return response()->json([
            'classes' => $classes,
            'attendance' => $attendance,
            'exams' => $exams,
            'quizzes' => $quizzes,
            'homework' => $homework,
            'library' => $library,
        ]);
    }

}
