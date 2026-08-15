<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\SectionDateHelper;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Shared read/write logic for exam_degrees and quiz_degrees section-date records.
 */
final class SectionDegreeRecordService
{
    /**
     * @param  array{table: string, date_column: string, history_name_key: string, history_label: string}  $config
     * @return array{date: string, session_id: ?int, session_options: Collection, rows: Collection}
     */
    public function getSectionDate(int $sectionId, string $date, ?int $filterSessionId, array $config): array
    {
        $tenantDb = DB::connection('center');
        $table = $config['table'];
        $dateColumn = $config['date_column'];

        $hasAttendance = Schema::connection('center')->hasColumn($table, 'attendance_status');
        $hasSession = Schema::connection('center')->hasColumn($table, 'session_id');

        $students = $tenantDb->table('students')
            ->where('section_id', $sectionId)
            ->whereNull('deleted_at')
            ->get(['id', 'name']);

        $recordCols = ['student_id', 'degree', 'notes'];
        if ($hasAttendance) {
            $recordCols[] = 'attendance_status';
        }

        $recordsQuery = $tenantDb->table($table)
            ->where('section_id', $sectionId)
            ->whereDate($dateColumn, $date);
        if ($filterSessionId && $hasSession) {
            $recordsQuery->where('session_id', $filterSessionId);
        }
        $records = $recordsQuery->get($recordCols)->keyBy('student_id');

        $rows = $students->map(function ($student) use ($records) {
            $record = $records->get($student->id);
            $status = 'present';
            if ($record && isset($record->attendance_status) && in_array($record->attendance_status, ['present', 'absent', 'late'], true)) {
                $status = $record->attendance_status;
            } elseif ($record) {
                $status = strtoupper((string) $record->degree) === 'ABSENT' ? 'absent' : 'present';
            }

            return [
                'student_id' => (int) $student->id,
                'student_name' => $student->name,
                'status' => $status,
                'degree' => $record && $status !== 'absent' ? (string) $record->degree : '',
                'notes' => $record?->notes ?? '',
            ];
        })->values();

        $sessionId = $filterSessionId;
        if (! $sessionId && $hasSession) {
            $linked = $tenantDb->table($table)
                ->where('section_id', $sectionId)
                ->whereDate($dateColumn, $date)
                ->whereNotNull('session_id')
                ->value('session_id');
            $sessionId = $linked ? (int) $linked : null;
        }

        return [
            'date' => $date,
            'session_id' => $sessionId,
            'session_options' => SectionDateHelper::sessionOptions($sectionId),
            'rows' => $rows,
        ];
    }

    /**
     * @param  array{table: string, date_column: string, history_name_key: string, history_label: string}  $config
     * @return array{days: Collection}
     */
    public function getSectionHistory(int $sectionId, array $config): array
    {
        $days = DB::connection('center')->table($config['table'])
            ->where('section_id', $sectionId)
            ->select(
                DB::raw('DATE('.$config['date_column'].') as date'),
                DB::raw('COUNT(*) as students_count')
            )
            ->groupBy(DB::raw('DATE('.$config['date_column'].')'))
            ->orderByDesc(DB::raw('DATE('.$config['date_column'].')'))
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                $config['history_name_key'] => $config['history_label'],
                'students_count' => (int) $row->students_count,
            ])
            ->values();

        return ['days' => $days];
    }

    /**
     * @param  array{table: string, date_column: string, history_name_key: string, history_label: string}  $config
     * @param  array{session_id?: int|null, rows: list<array{student_id: int, status: string, degree?: ?string, notes?: ?string}>}  $payload
     */
    public function saveSectionDate(int $sectionId, string $date, array $payload, array $config): void
    {
        $sessionId = isset($payload['session_id']) ? (int) $payload['session_id'] : null;
        $this->assertSessionBelongsToSection($sessionId, $sectionId);

        $table = $config['table'];
        $dateColumn = $config['date_column'];
        $hasAttendance = Schema::connection('center')->hasColumn($table, 'attendance_status');
        $hasSession = Schema::connection('center')->hasColumn($table, 'session_id');

        $tenantDb = DB::connection('center');
        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        DB::connection('center')->transaction(function () use (
            $tenantDb,
            $payload,
            $sectionId,
            $date,
            $table,
            $dateColumn,
            $hasAttendance,
            $hasSession,
            $sessionId,
            $students,
        ): void {
            foreach ($payload['rows'] as $row) {
                $student = $students->get($row['student_id']);
                if (! $student || (int) $student->section_id !== $sectionId) {
                    continue;
                }

                $exists = $tenantDb->table($table)
                    ->where('student_id', $row['student_id'])
                    ->whereDate($dateColumn, $date)
                    ->exists();

                $data = [
                    'student_id' => (int) $row['student_id'],
                    'grade_id' => (int) $student->grade_id,
                    'class_id' => (int) $student->class_id,
                    'section_id' => (int) $student->section_id,
                    $dateColumn => $date,
                    'degree' => $row['status'] === 'absent' ? '' : (string) ($row['degree'] ?? '0'),
                    'notes' => $row['notes'] ?? null,
                    'updated_at' => now(),
                ];
                if ($hasAttendance) {
                    $data['attendance_status'] = $row['status'];
                }
                if ($hasSession) {
                    $data['session_id'] = $sessionId;
                }

                if ($exists) {
                    $tenantDb->table($table)
                        ->where('student_id', $row['student_id'])
                        ->whereDate($dateColumn, $date)
                        ->update($data);
                } else {
                    $data['created_at'] = now();
                    $tenantDb->table($table)->insert($data);
                }
            }
        });
    }

    private function assertSessionBelongsToSection(?int $sessionId, int $sectionId): void
    {
        if (! $sessionId) {
            return;
        }

        if (! SectionDateHelper::validateSessionBelongsToSection($sessionId, $sectionId)) {
            throw new HttpResponseException(
                response()->json(['message' => 'session_id does not belong to this section'], 422)
            );
        }
    }
}
