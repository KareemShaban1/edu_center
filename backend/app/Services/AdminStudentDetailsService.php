<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\Support\MediaUrlHelper;
use App\Models\StudentHomework;
use Illuminate\Database\Connection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class AdminStudentDetailsService
{
    /**
     * @return array<string, mixed>|null
     */
    public function build(Connection $tenantDb, int $studentId): ?array
    {
        $studentsHasIsActive = Schema::connection('center')->hasColumn('students', 'is_active');
        $hasPhone = Schema::connection('center')->hasColumn('students', 'phone');

        $select = [
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
            $select[] = 'students.is_active';
        }
        if ($hasPhone) {
            $select[] = 'students.phone';
        }

        $query = $tenantDb->table('students')
            ->leftJoin('grades', 'students.grade_id', '=', 'grades.id')
            ->leftJoin('classes', 'students.class_id', '=', 'classes.id')
            ->leftJoin('sections', 'students.section_id', '=', 'sections.id')
            ->where('students.id', $studentId);

        if (Schema::connection('center')->hasColumn('students', 'deleted_at')) {
            $query->whereNull('students.deleted_at');
        }

        $row = $query->select($select)->first();
        if (! $row) {
            return null;
        }

        $gradeId = (int) ($row->grade_id ?? 0);
        $classId = (int) ($row->class_id ?? 0);
        $sectionId = (int) ($row->section_id ?? 0);

        $parent = null;
        if (! empty($row->parent_id) && Schema::connection('center')->hasTable('parents')) {
            $parentRow = $tenantDb->table('parents')->where('id', $row->parent_id)->first();
            if ($parentRow) {
                $parent = [
                    'id' => (int) $parentRow->id,
                    'name' => (string) ($parentRow->parent_name ?? $parentRow->name ?? ''),
                    'email' => (string) ($parentRow->email ?? ''),
                    'phone' => (string) ($parentRow->parent_phone ?? $parentRow->phone ?? ''),
                ];
            }
        }

        $attendance = $this->attendance($tenantDb, $studentId);
        $exams = $this->examDegrees($tenantDb, $studentId);
        $quizzes = $this->quizDegrees($tenantDb, $studentId);
        $homework = $this->homework($tenantDb, $studentId, $gradeId, $classId, $sectionId);
        $payments = $this->payments($tenantDb, $studentId);
        $certifications = $this->certifications($tenantDb, $studentId);
        $announcements = $this->announcements($tenantDb, $gradeId, $classId, $sectionId);
        $notifications = $this->notifications($tenantDb, $studentId);
        $sessions = $this->sessions($tenantDb, $gradeId, $classId, $sectionId);

        $presentCount = $attendance->where('status', 'present')->count() + $attendance->where('status', 'late')->count();
        $attendanceTotal = $attendance->count();
        $paidPayments = $payments->where('status', 'paid');
        $unpaidPayments = $payments->where('status', 'unpaid');

        return [
            'student' => [
                'id' => (int) $row->id,
                'code' => (string) ($row->code ?? ''),
                'name' => (string) $row->name,
                'email' => (string) ($row->email ?? ''),
                'phone' => $hasPhone ? (string) ($row->phone ?? '') : '',
                'gender' => (string) ($row->gender ?? ''),
                'status' => isset($row->is_active) ? ((int) $row->is_active === 1 ? 'active' : 'inactive') : 'active',
                'grade_id' => $gradeId,
                'classroom_id' => $classId,
                'section_id' => $sectionId,
                'grade_name' => (string) ($row->grade_name ?? ''),
                'class_name' => (string) ($row->class_name ?? ''),
                'section_name' => (string) ($row->section_name ?? ''),
                'parent_id' => $row->parent_id ? (int) $row->parent_id : null,
                'created_at' => $row->created_at
                    ? Carbon::parse((string) $row->created_at)->toDateString()
                    : now()->toDateString(),
            ],
            'parent' => $parent,
            'summary' => [
                'attendance_total' => $attendanceTotal,
                'attendance_present' => $presentCount,
                'attendance_rate' => $attendanceTotal > 0
                    ? round(($presentCount / $attendanceTotal) * 100, 1)
                    : 0.0,
                'exams_count' => $exams->count(),
                'exams_avg' => ($avg = $exams->whereNotNull('score')->avg('score')) !== null
                    ? round((float) $avg, 1)
                    : null,
                'quizzes_count' => $quizzes->count(),
                'quizzes_avg' => ($qAvg = $quizzes->whereNotNull('score')->avg('score')) !== null
                    ? round((float) $qAvg, 1)
                    : null,
                'homework_total' => $homework->count(),
                'homework_submitted' => $homework->where('status', '!=', 'not_submitted')->count(),
                'payments_paid' => $paidPayments->count(),
                'payments_unpaid' => $unpaidPayments->count(),
                'payments_paid_amount' => (float) $paidPayments->sum('amount'),
                'payments_unpaid_amount' => (float) $unpaidPayments->sum('amount'),
                'certifications_count' => $certifications->count(),
                'notifications_count' => $notifications->count(),
                'announcements_count' => $announcements->count(),
                'sessions_count' => $sessions->count(),
            ],
            'attendance' => $attendance->values()->all(),
            'exams' => $exams->values()->all(),
            'quizzes' => $quizzes->values()->all(),
            'homework' => $homework->values()->all(),
            'payments' => $payments->values()->all(),
            'certifications' => $certifications->values()->all(),
            'announcements' => $announcements->values()->all(),
            'notifications' => $notifications->values()->all(),
            'sessions' => $sessions->values()->all(),
        ];
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function attendance(Connection $tenantDb, int $studentId)
    {
        if (! Schema::connection('center')->hasTable('attendances')) {
            return collect();
        }

        return $tenantDb->table('attendances')
            ->where('student_id', $studentId)
            ->orderByDesc('attendance_date')
            ->limit(500)
            ->get(['id', 'attendance_date', 'attendance_status', 'notes'])
            ->map(function ($row) {
                $status = ((int) $row->attendance_status) === 1
                    ? 'present'
                    : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');

                return [
                    'id' => (int) $row->id,
                    'date' => (string) $row->attendance_date,
                    'status' => $status,
                    'notes' => (string) ($row->notes ?? ''),
                ];
            });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function examDegrees(Connection $tenantDb, int $studentId)
    {
        if (! Schema::connection('center')->hasTable('exam_degrees')) {
            return collect();
        }

        $cols = ['id', 'exam_date', 'degree', 'notes'];
        if (Schema::connection('center')->hasColumn('exam_degrees', 'attendance_status')) {
            $cols[] = 'attendance_status';
        }
        if (Schema::connection('center')->hasColumn('exam_degrees', 'session_id')) {
            $cols[] = 'session_id';
        }

        return $tenantDb->table('exam_degrees')
            ->where('student_id', $studentId)
            ->orderByDesc('exam_date')
            ->limit(300)
            ->get($cols)
            ->map(function ($row) {
                $attendance = $row->attendance_status ?? 'present';

                return [
                    'id' => (int) $row->id,
                    'date' => (string) $row->exam_date,
                    'score' => is_numeric($row->degree) ? (float) $row->degree : null,
                    'total' => 100,
                    'attendance_status' => in_array($attendance, ['present', 'absent', 'late'], true)
                        ? $attendance
                        : 'present',
                    'notes' => (string) ($row->notes ?? ''),
                    'session_id' => isset($row->session_id) && $row->session_id ? (int) $row->session_id : null,
                ];
            });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function quizDegrees(Connection $tenantDb, int $studentId)
    {
        if (! Schema::connection('center')->hasTable('quiz_degrees')) {
            return collect();
        }

        $cols = ['id', 'quiz_date', 'degree', 'notes'];
        if (Schema::connection('center')->hasColumn('quiz_degrees', 'attendance_status')) {
            $cols[] = 'attendance_status';
        }
        if (Schema::connection('center')->hasColumn('quiz_degrees', 'session_id')) {
            $cols[] = 'session_id';
        }

        return $tenantDb->table('quiz_degrees')
            ->where('student_id', $studentId)
            ->orderByDesc('quiz_date')
            ->limit(300)
            ->get($cols)
            ->map(function ($row) {
                $attendance = $row->attendance_status ?? 'present';

                return [
                    'id' => (int) $row->id,
                    'date' => (string) $row->quiz_date,
                    'score' => is_numeric($row->degree) ? (float) $row->degree : null,
                    'total' => 20,
                    'attendance_status' => in_array($attendance, ['present', 'absent', 'late'], true)
                        ? $attendance
                        : 'present',
                    'notes' => (string) ($row->notes ?? ''),
                    'session_id' => isset($row->session_id) && $row->session_id ? (int) $row->session_id : null,
                ];
            });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function homework(Connection $tenantDb, int $studentId, int $gradeId, int $classId, int $sectionId)
    {
        if (! Schema::connection('center')->hasTable('homeworks')) {
            return collect();
        }

        $homeworks = $tenantDb->table('homeworks')
            ->where('grade_id', $gradeId)
            ->where('class_id', $classId)
            ->where('section_id', $sectionId)
            ->orderByDesc('due_date')
            ->limit(300)
            ->get(['id', 'title', 'due_date']);

        if (! Schema::connection('center')->hasTable('student_homework')) {
            return $homeworks->map(fn ($row) => [
                'id' => 'h-'.$row->id,
                'submission_id' => null,
                'homework_id' => (int) $row->id,
                'title' => (string) $row->title,
                'due_date' => (string) $row->due_date,
                'status' => 'not_submitted',
                'grade' => null,
                'student_notes' => '',
                'response' => '',
                'file_url' => null,
                'file_name' => null,
                'correction_url' => null,
                'correction_name' => null,
                'upload_date' => '',
            ]);
        }

        $submissions = $tenantDb->table('student_homework')
            ->where('student_id', $studentId)
            ->get()
            ->keyBy('homework_id');

        return $homeworks->map(function ($row) use ($submissions) {
            $submission = $submissions->get($row->id);
            $fileUrl = null;
            $fileName = null;
            $correctionUrl = null;
            $correctionName = null;

            if ($submission) {
                $submissionModel = StudentHomework::query()->find($submission->id);
                $media = $submissionModel?->getFirstMedia('homework');
                $correction = $submissionModel?->getFirstMedia('correction');
                if ($media) {
                    $fileUrl = MediaUrlHelper::publicPath($media);
                    $fileName = $media->file_name;
                }
                if ($correction) {
                    $correctionUrl = MediaUrlHelper::publicPath($correction);
                    $correctionName = $correction->file_name;
                }
            }

            return [
                'id' => $submission ? (int) $submission->id : ('h-'.$row->id),
                'submission_id' => $submission ? (int) $submission->id : null,
                'homework_id' => (int) $row->id,
                'title' => (string) $row->title,
                'due_date' => (string) $row->due_date,
                'status' => (string) ($submission->status ?? 'not_submitted'),
                'grade' => $submission->degree ?? null,
                'student_notes' => (string) ($submission->student_notes ?? ''),
                'response' => (string) ($submission->response ?? ''),
                'file_url' => $fileUrl,
                'file_name' => $fileName,
                'correction_url' => $correctionUrl,
                'correction_name' => $correctionName,
                'upload_date' => $submission && $submission->upload_date_time
                    ? (string) $submission->upload_date_time
                    : '',
            ];
        });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function payments(Connection $tenantDb, int $studentId)
    {
        if (! Schema::connection('center')->hasTable('payments')) {
            return collect();
        }

        $query = $tenantDb->table('payments')->where('payments.student_id', $studentId);
        $hasFees = Schema::connection('center')->hasTable('fees');
        if ($hasFees) {
            $query->leftJoin('fees', 'payments.fee_id', '=', 'fees.id');
        }

        return $query
            ->orderByDesc('payments.payment_date')
            ->orderByDesc('payments.id')
            ->limit(200)
            ->get($hasFees
                ? [
                    'payments.id',
                    'payments.payment_date',
                    'payments.payment_status',
                    'payments.amount',
                    'payments.month',
                    'fees.title as fee_title',
                ]
                : [
                    'payments.id',
                    'payments.payment_date',
                    'payments.payment_status',
                    'payments.amount',
                    'payments.month',
                ])
            ->map(function ($row) {
                $status = isset($row->payment_status) && (int) $row->payment_status === 1 ? 'paid' : 'unpaid';

                return [
                    'id' => (int) $row->id,
                    'item' => ($row->fee_title ?? null) ?: ('Fee '.($row->month ?? '')),
                    'amount' => (float) ($row->amount ?? 0),
                    'status' => $status,
                    'due_date' => (string) ($row->payment_date ?? ''),
                    'month' => (string) ($row->month ?? ''),
                ];
            });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function certifications(Connection $tenantDb, int $studentId)
    {
        if (! Schema::connection('center')->hasTable('student_certifications')) {
            return collect();
        }

        return $tenantDb->table('student_certifications')
            ->where('student_id', $studentId)
            ->orderByDesc('issued_at')
            ->limit(200)
            ->get(['id', 'template_id', 'title', 'context', 'context_date', 'issued_at', 'is_custom'])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'template_id' => $row->template_id ? (int) $row->template_id : null,
                    'title' => (string) $row->title,
                    'context' => (string) ($row->context ?? 'manual'),
                    'context_date' => $row->context_date ? (string) $row->context_date : null,
                    'issued_at' => $row->issued_at ? (string) $row->issued_at : null,
                    'is_custom' => (bool) ($row->is_custom ?? false),
                ];
            });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function announcements(Connection $tenantDb, int $gradeId, int $classId, int $sectionId)
    {
        if (! Schema::connection('center')->hasTable('announcements')) {
            return collect();
        }

        $query = $tenantDb->table('announcements')
            ->where('grade_id', $gradeId)
            ->where('class_id', $classId)
            ->where('section_id', $sectionId)
            ->orderByDesc('id')
            ->limit(100);

        if (Schema::connection('center')->hasColumn('announcements', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        return $query
            ->get(['id', 'title', 'body', 'time', 'announcement_type', 'created_at'])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'title' => (string) $row->title,
                'content' => (string) ($row->body ?? ''),
                'time' => $row->time ? (string) $row->time : null,
                'type' => (string) ($row->announcement_type ?: 'others'),
                'created_at' => $row->created_at ? (string) $row->created_at : null,
            ]);
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function notifications(Connection $tenantDb, int $studentId)
    {
        if (! Schema::connection('center')->hasTable('notifications')) {
            return collect();
        }

        return $tenantDb->table('notifications')
            ->where('notifiable_id', $studentId)
            ->where(function ($q) {
                $q->where('notifiable_type', 'like', '%Student%');
            })
            ->orderByDesc('created_at')
            ->limit(200)
            ->get(['id', 'type', 'data', 'read_at', 'created_at'])
            ->map(function ($row) {
                /** @var array<string, mixed> $data */
                $data = json_decode((string) $row->data, true) ?: [];

                return [
                    'id' => (string) $row->id,
                    'type' => class_basename((string) $row->type),
                    'title' => (string) ($data['title'] ?? ''),
                    'body' => (string) ($data['body'] ?? $data['message'] ?? ''),
                    'channel_type' => (string) ($data['type'] ?? 'general'),
                    'read_at' => $row->read_at ? (string) $row->read_at : null,
                    'created_at' => $row->created_at
                        ? Carbon::parse((string) $row->created_at)->toIso8601String()
                        : null,
                ];
            });
    }

    /** @return \Illuminate\Support\Collection<int, array<string, mixed>> */
    private function sessions(Connection $tenantDb, int $gradeId, int $classId, int $sectionId)
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return collect();
        }

        return $tenantDb->table('sessions')
            ->where('grade_id', $gradeId)
            ->where('class_id', $classId)
            ->where('section_id', $sectionId)
            ->orderByDesc('start_at')
            ->limit(100)
            ->get(['id', 'topic', 'created_by', 'start_at', 'duration', 'provider', 'location', 'notes'])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'topic' => (string) ($row->topic ?? ''),
                'teacher' => (string) ($row->created_by ?: ''),
                'start_at' => (string) ($row->start_at ?? ''),
                'duration' => (int) ($row->duration ?? 0),
                'provider' => (string) ($row->provider ?? ''),
                'location' => (string) ($row->location ?? ''),
                'notes' => (string) ($row->notes ?? ''),
            ]);
    }
}
