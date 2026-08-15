<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\SectionWeekDays;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class SectionService
{
    public function __construct(
        private readonly AutoGenerateSessionsService $autoGenerateSessionsService,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function create(array $payload): array
    {
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
        $this->syncTeacherSection((int) $id, $payload['teacher_id'] ?? null);

        $weekDays = SectionWeekDays::decode($insert['week_days'] ?? null);
        if ($weekDays !== []) {
            $this->autoGenerateSessionsService->generateForCurrentCenter(respectSetting: true);
        }

        return [
            'id' => (int) $id,
            'name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['class_id'],
            'teacher_id' => $payload['teacher_id'] ?? null,
            'week_days' => $weekDays,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>|null
     */
    public function update(int $id, array $payload): ?array
    {
        $exists = DB::connection('center')->table('sections')->where('id', $id)->exists();
        if (! $exists) {
            return null;
        }

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
        $this->syncTeacherSection($id, $payload['teacher_id'] ?? null);

        $weekDays = SectionWeekDays::decode($update['week_days'] ?? null);
        if ($weekDays !== []) {
            $this->autoGenerateSessionsService->generateForCurrentCenter(respectSetting: true);
        }

        return [
            'id' => $id,
            'name' => $payload['name'],
            'grade_id' => $payload['grade_id'],
            'class_id' => $payload['class_id'],
            'teacher_id' => $payload['teacher_id'] ?? null,
            'week_days' => $weekDays,
        ];
    }

    public function delete(int $id): ?string
    {
        $exists = DB::connection('center')->table('sections')->where('id', $id)->exists();
        if (! $exists) {
            return null;
        }

        if ($this->hasRelatedRecords($id)) {
            return 'related';
        }

        if (Schema::connection('center')->hasTable('teacher_section')) {
            DB::connection('center')->table('teacher_section')->where('section_id', $id)->delete();
        }

        DB::connection('center')->table('sections')->where('id', $id)->delete();

        return 'deleted';
    }

    public function hasRelatedRecords(int $sectionId): bool
    {
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

            $exists = DB::connection('center')->table($table)
                ->where('section_id', $sectionId)
                ->exists();
            if ($exists) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{section: array<string, mixed>|null, sessions: list<array<string, mixed>>}|null
     */
    public function sessions(int $sectionId): ?array
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return [
                'section' => null,
                'sessions' => [],
            ];
        }

        $tenantDb = DB::connection('center');
        $section = $tenantDb->table('sections')
            ->leftJoin('grades', 'sections.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'sections.class_id', '=', 'classes.id')
            ->where('sections.id', $sectionId)
            ->select(
                'sections.id',
                'sections.section_name as name',
                'sections.grade_id',
                'sections.class_id',
                'grades.grade_name as grade_name',
                'classes.class_name as class_name'
            )
            ->first();

        if (! $section) {
            return null;
        }

        $hasLocationCol = Schema::connection('center')->hasColumn('sessions', 'location');
        $hasSessionOnAttendance = Schema::connection('center')->hasColumn('attendances', 'session_id');
        $hasSessionOnExam = Schema::connection('center')->hasColumn('exam_degrees', 'session_id');
        $hasSessionOnQuiz = Schema::connection('center')->hasColumn('quiz_degrees', 'session_id');
        $examHasAttendance = Schema::connection('center')->hasColumn('exam_degrees', 'attendance_status');
        $quizHasAttendance = Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status');

        $sessionRows = $tenantDb->table('sessions')
            ->where('section_id', $sectionId)
            ->orderByDesc('start_at')
            ->get();

        $sessionIds = $sessionRows->pluck('id')->map(fn ($sessionId) => (int) $sessionId)->all();

        $attendanceBySession = $this->attendanceBySession($tenantDb, $hasSessionOnAttendance, $sessionIds);
        $examsBySession = $this->examsBySession($tenantDb, $hasSessionOnExam, $examHasAttendance, $sessionIds);
        $quizzesBySession = $this->quizzesBySession($tenantDb, $hasSessionOnQuiz, $quizHasAttendance, $sessionIds);

        $sessions = $sessionRows->map(function ($row) use (
            $hasLocationCol,
            $attendanceBySession,
            $examsBySession,
            $quizzesBySession,
            $examHasAttendance,
            $quizHasAttendance,
        ) {
            return $this->mapSectionSession(
                $row,
                $hasLocationCol,
                $attendanceBySession,
                $examsBySession,
                $quizzesBySession,
                $examHasAttendance,
                $quizHasAttendance,
            );
        })->values()->all();

        return [
            'section' => [
                'id' => (int) $section->id,
                'name' => (string) $section->name,
                'grade_id' => (int) $section->grade_id,
                'class_id' => (int) $section->class_id,
                'grade_name' => (string) ($section->grade_name ?? ''),
                'class_name' => (string) ($section->class_name ?? ''),
            ],
            'sessions' => $sessions,
        ];
    }

    private function syncTeacherSection(int $sectionId, mixed $teacherId): void
    {
        if (! Schema::connection('center')->hasTable('teacher_section')) {
            return;
        }

        DB::connection('center')->table('teacher_section')->where('section_id', $sectionId)->delete();
        if (! empty($teacherId)) {
            DB::connection('center')->table('teacher_section')->insert([
                'teacher_id' => (int) $teacherId,
                'section_id' => $sectionId,
            ]);
        }
    }

    /**
     * @param  list<int>  $sessionIds
     */
    private function attendanceBySession(\Illuminate\Database\Connection $tenantDb, bool $hasSessionOnAttendance, array $sessionIds): Collection
    {
        if (! $hasSessionOnAttendance || $sessionIds === []) {
            return collect();
        }

        return $tenantDb->table('attendances')
            ->leftJoin('students', 'attendances.student_id', '=', 'students.id')
            ->whereIn('attendances.session_id', $sessionIds)
            ->select(
                'attendances.session_id',
                'attendances.student_id',
                'students.name as student_name',
                'attendances.attendance_date',
                'attendances.attendance_status',
                'attendances.notes'
            )
            ->get()
            ->groupBy('session_id');
    }

    /**
     * @param  list<int>  $sessionIds
     */
    private function examsBySession(
        \Illuminate\Database\Connection $tenantDb,
        bool $hasSessionOnExam,
        bool $examHasAttendance,
        array $sessionIds,
    ): Collection {
        if (! $hasSessionOnExam || $sessionIds === []) {
            return collect();
        }

        $examCols = ['exam_degrees.session_id', 'exam_degrees.student_id', 'students.name as student_name', 'exam_degrees.exam_date', 'exam_degrees.degree', 'exam_degrees.notes'];
        if ($examHasAttendance) {
            $examCols[] = 'exam_degrees.attendance_status';
        }

        return $tenantDb->table('exam_degrees')
            ->leftJoin('students', 'exam_degrees.student_id', '=', 'students.id')
            ->whereIn('exam_degrees.session_id', $sessionIds)
            ->select($examCols)
            ->get()
            ->groupBy('session_id');
    }

    /**
     * @param  list<int>  $sessionIds
     */
    private function quizzesBySession(
        \Illuminate\Database\Connection $tenantDb,
        bool $hasSessionOnQuiz,
        bool $quizHasAttendance,
        array $sessionIds,
    ): Collection {
        if (! $hasSessionOnQuiz || $sessionIds === []) {
            return collect();
        }

        $quizCols = ['quiz_degrees.session_id', 'quiz_degrees.student_id', 'students.name as student_name', 'quiz_degrees.quiz_date', 'quiz_degrees.degree', 'quiz_degrees.notes'];
        if ($quizHasAttendance) {
            $quizCols[] = 'quiz_degrees.attendance_status';
        }

        return $tenantDb->table('quiz_degrees')
            ->leftJoin('students', 'quiz_degrees.student_id', '=', 'students.id')
            ->whereIn('quiz_degrees.session_id', $sessionIds)
            ->select($quizCols)
            ->get()
            ->groupBy('session_id');
    }

    /**
     * @return array<string, mixed>
     */
    private function mapSectionSession(
        object $row,
        bool $hasLocationCol,
        Collection $attendanceBySession,
        Collection $examsBySession,
        Collection $quizzesBySession,
        bool $examHasAttendance,
        bool $quizHasAttendance,
    ): array {
        $sessionId = (int) $row->id;

        $attendanceRecords = ($attendanceBySession->get($sessionId) ?? collect())->map(function ($record) {
            return [
                'student_id' => (int) $record->student_id,
                'student_name' => (string) ($record->student_name ?? ''),
                'date' => $record->attendance_date ? (string) $record->attendance_date : '',
                'status' => $this->mapAttendanceStatus($record->attendance_status),
                'notes' => $record->notes ?? '',
            ];
        })->values();

        $examRecords = ($examsBySession->get($sessionId) ?? collect())->map(function ($record) use ($examHasAttendance) {
            $status = 'present';
            if ($examHasAttendance && isset($record->attendance_status) && in_array($record->attendance_status, ['present', 'absent', 'late'], true)) {
                $status = $record->attendance_status;
            } elseif (strtoupper((string) $record->degree) === 'ABSENT') {
                $status = 'absent';
            }

            return [
                'student_id' => (int) $record->student_id,
                'student_name' => (string) ($record->student_name ?? ''),
                'date' => $record->exam_date ? (string) $record->exam_date : '',
                'degree' => (string) ($record->degree ?? ''),
                'status' => $status,
                'notes' => $record->notes ?? '',
            ];
        })->values();

        $quizRecords = ($quizzesBySession->get($sessionId) ?? collect())->map(function ($record) use ($quizHasAttendance) {
            $status = 'present';
            if ($quizHasAttendance && isset($record->attendance_status) && in_array($record->attendance_status, ['present', 'absent', 'late'], true)) {
                $status = $record->attendance_status;
            } elseif (strtoupper((string) $record->degree) === 'ABSENT') {
                $status = 'absent';
            }

            return [
                'student_id' => (int) $record->student_id,
                'student_name' => (string) ($record->student_name ?? ''),
                'date' => $record->quiz_date ? (string) $record->quiz_date : '',
                'degree' => (string) ($record->degree ?? ''),
                'status' => $status,
                'notes' => $record->notes ?? '',
            ];
        })->values();

        return [
            'id' => $sessionId,
            'topic' => (string) $row->topic,
            'start_at' => $row->start_at ? (string) $row->start_at : '',
            'duration' => (int) $row->duration,
            'session_type' => (string) ($row->session_type ?? 'online'),
            'provider' => $row->provider,
            'join_url' => $row->join_url ?? null,
            'location' => $hasLocationCol ? ($row->location ?? '') : '',
            'notes' => $hasLocationCol ? ($row->notes ?? '') : '',
            'created_by' => (string) ($row->created_by ?? ''),
            'attendance' => [
                'total' => $attendanceRecords->count(),
                'present' => $attendanceRecords->where('status', 'present')->count(),
                'absent' => $attendanceRecords->where('status', 'absent')->count(),
                'late' => $attendanceRecords->where('status', 'late')->count(),
                'records' => $attendanceRecords->all(),
            ],
            'exams' => [
                'total' => $examRecords->count(),
                'records' => $examRecords->all(),
            ],
            'quizzes' => [
                'total' => $quizRecords->count(),
                'records' => $quizRecords->all(),
            ],
        ];
    }

    private function mapAttendanceStatus(mixed $value): string
    {
        $n = (int) $value;
        if ($n === 0) {
            return 'absent';
        }
        if ($n === 2) {
            return 'late';
        }

        return 'present';
    }
}
