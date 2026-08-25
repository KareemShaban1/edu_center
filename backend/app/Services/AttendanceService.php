<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Attendance;
use App\Models\Student;
use App\Notifications\ParentAttendanceNotification;
use App\Notifications\StudentAttendanceNotification;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class AttendanceService
{
    public function __construct(
        private readonly NotificationDispatchService $notificationDispatchService,
    ) {}

    /**
     * @return array{date: string, section: array{id: int, grade_id: int, class_id: int}, session_id: ?int, session_options: Collection, rows: Collection}
     */
    public function getSectionDate(int $sectionId, string $date, ?int $filterSessionId): array
    {
        $tenantDb = DB::connection('center');
        $hasSessionOnAttendance = Schema::connection('center')->hasColumn('attendances', 'session_id');
        $hasQrCheckIn = Schema::connection('center')->hasColumn('attendances', 'checked_in_at');

        $attendanceColumns = ['student_id', 'attendance_status', 'notes'];
        if ($hasQrCheckIn) {
            $attendanceColumns = array_merge($attendanceColumns, [
                'checked_in_at',
                'check_in_latitude',
                'check_in_longitude',
                'check_in_accuracy_m',
                'check_in_distance_m',
                'check_in_method',
            ]);
        }

        $students = $tenantDb->table('students')
            ->where('section_id', $sectionId)
            ->whereNull('deleted_at')
            ->get(['id', 'name', 'grade_id', 'class_id', 'section_id']);

        $attendanceQuery = $tenantDb->table('attendances')
            ->where('section_id', $sectionId)
            ->whereDate('attendance_date', $date);
        if ($filterSessionId && $hasSessionOnAttendance) {
            $attendanceQuery->where('session_id', $filterSessionId);
        }
        $attendanceByStudent = $attendanceQuery
            ->get($attendanceColumns)
            ->keyBy('student_id');

        $rows = $students->map(function ($student) use ($attendanceByStudent, $hasQrCheckIn) {
            $record = $attendanceByStudent->get($student->id);
            $status = 'present';
            if ($record) {
                $value = (int) $record->attendance_status;
                $status = $value === 0 ? 'absent' : ($value === 2 ? 'late' : 'present');
            }

            $row = [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'grade_id' => $student->grade_id,
                'class_id' => $student->class_id,
                'section_id' => $student->section_id,
                'status' => $status,
                'notes' => $record?->notes ?? '',
            ];

            if ($hasQrCheckIn) {
                $method = isset($record->check_in_method) ? (string) ($record->check_in_method ?? '') : '';
                $checkedInAt = ! empty($record?->checked_in_at) ? (string) $record->checked_in_at : null;
                $scanned = $method === 'qr' && $checkedInAt !== null;

                $row['qr_check_in'] = [
                    'scanned' => $scanned,
                    'method' => $method !== '' ? $method : null,
                    'checked_in_at' => $checkedInAt,
                    'latitude' => isset($record->check_in_latitude) && $record->check_in_latitude !== null
                        ? (float) $record->check_in_latitude
                        : null,
                    'longitude' => isset($record->check_in_longitude) && $record->check_in_longitude !== null
                        ? (float) $record->check_in_longitude
                        : null,
                    'accuracy_m' => isset($record->check_in_accuracy_m) && $record->check_in_accuracy_m !== null
                        ? (float) $record->check_in_accuracy_m
                        : null,
                    'distance_m' => isset($record->check_in_distance_m) && $record->check_in_distance_m !== null
                        ? (float) $record->check_in_distance_m
                        : null,
                ];
            }

            return $row;
        })->values();

        $sessionId = $filterSessionId;
        if (! $sessionId && $hasSessionOnAttendance) {
            $linked = $tenantDb->table('attendances')
                ->where('section_id', $sectionId)
                ->whereDate('attendance_date', $date)
                ->whereNotNull('session_id')
                ->value('session_id');
            $sessionId = $linked ? (int) $linked : null;
        }

        return [
            'date' => $date,
            'session_id' => $sessionId,
            'session_options' => \App\Http\Support\SectionDateHelper::sessionOptions($sectionId),
            'rows' => $rows,
        ];
    }

    /**
     * @return array{section: array{id: int, grade_id: int, class_id: int}, days: Collection}
     */
    public function getSectionHistory(int $sectionId): array
    {
        $history = DB::connection('center')->table('attendances')
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
            ->map(static fn ($row) => [
                'date' => $row->date,
                'present' => (int) $row->present,
                'absent' => (int) $row->absent,
                'late' => (int) $row->late,
                'total' => (int) $row->total,
            ])
            ->values();

        return ['days' => $history];
    }

    /**
     * @param  array{session_id?: int|null, rows: list<array{student_id: int, status: string, notes?: ?string}>}  $payload
     */
    public function saveSectionDate(int $sectionId, string $date, array $payload, bool $autoNotify = true): void
    {
        $sessionId = isset($payload['session_id']) ? (int) $payload['session_id'] : null;
        $this->assertSessionBelongsToSection($sessionId, $sectionId);

        $tenantDb = DB::connection('center');
        $statusMap = ['present' => 1, 'absent' => 0, 'late' => 2];
        $hasSessionCol = Schema::connection('center')->hasColumn('attendances', 'session_id');

        $students = $tenantDb->table('students')
            ->whereIn('id', collect($payload['rows'])->pluck('student_id')->all())
            ->get(['id', 'grade_id', 'class_id', 'section_id'])
            ->keyBy('id');

        DB::connection('center')->transaction(function () use (
            $tenantDb,
            $payload,
            $sectionId,
            $date,
            $statusMap,
            $hasSessionCol,
            $sessionId,
            $students,
        ): void {
            foreach ($payload['rows'] as $row) {
                $student = $students->get($row['student_id']);
                if (! $student || (int) $student->section_id !== $sectionId) {
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
                if ($hasSessionCol) {
                    $data['session_id'] = $sessionId;
                }

                if ($exists) {
                    $update = $data;
                    unset($update['created_at']);
                    $tenantDb->table('attendances')
                        ->where('student_id', $row['student_id'])
                        ->whereDate('attendance_date', $date)
                        ->update($update);
                } else {
                    $data['created_at'] = now();
                    $tenantDb->table('attendances')->insert($data);
                }
            }
        });

        if ($autoNotify) {
            $this->dispatchAttendanceNotifications($payload['rows'], $date);
        }
    }

    /**
     * @param  list<array{student_id: int, status: string, notes?: ?string}>  $rows
     */
    private function dispatchAttendanceNotifications(array $rows, string $date): void
    {
        foreach ($rows as $row) {
            $student = Student::query()->find($row['student_id']);
            if (! $student) {
                continue;
            }

            $attendance = Attendance::query()
                ->where('student_id', $row['student_id'])
                ->whereDate('attendance_date', $date)
                ->first();
            if (! $attendance) {
                continue;
            }

            $this->notificationDispatchService->dispatch($student, new StudentAttendanceNotification($attendance), true);

            $parent = $student->parents;
            if ($parent) {
                $this->notificationDispatchService->dispatch($parent, new ParentAttendanceNotification($attendance), true);
            }
        }
    }

    private function assertSessionBelongsToSection(?int $sessionId, int $sectionId): void
    {
        if (! $sessionId) {
            return;
        }

        $sessionRow = DB::connection('center')->table('sessions')
            ->where('id', $sessionId)
            ->where('section_id', $sectionId)
            ->first();

        if (! $sessionRow) {
            throw new HttpResponseException(
                response()->json(['message' => 'session_id does not belong to this section'], 422)
            );
        }
    }
}
