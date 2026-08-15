<?php

declare(strict_types=1);

namespace App\Services;

use App\Centers\CenterContext;
use App\Http\Support\MediaUrlHelper;
use App\Http\Support\MultiCenterPortalService;
use App\Models\Library;
use App\Models\StudentHomework;
use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;

final class StudentBootstrapService
{
    public function __construct(
        private readonly MultiCenterPortalService $portalService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(Connection $tenantDb, int $studentId, object $student): array
    {
        $gradeId = (int) ($student->grade_id ?? 0);
        $classId = (int) ($student->class_id ?? 0);
        $sectionId = (int) ($student->section_id ?? 0);

        $center = CenterContext::center();
        $homeworkData = $this->homework($tenantDb, $studentId, $gradeId, $classId, $sectionId);

        return [
            'sessions' => $this->sessions($tenantDb, $gradeId, $classId, $sectionId),
            'attendance' => $this->attendance($tenantDb, $studentId),
            'grades' => $this->grades($tenantDb, $studentId),
            'homework' => $homeworkData['homework'],
            'homework_options' => $homeworkData['options'],
            'library' => $this->library($tenantDb, $gradeId, $classId, $sectionId),
            'certifications' => $this->certifications($tenantDb, $studentId),
            'announcements' => $this->announcements($tenantDb, $gradeId, $classId, $sectionId),
            'fees' => $this->fees($tenantDb, $studentId),
            'centers' => $center
                ? [$this->portalService->buildStudentCenterSummary($center, $studentId)]
                : [],
        ];
    }

    private function sessions(Connection $tenantDb, int $gradeId, int $classId, int $sectionId): Collection
    {
        if (! Schema::connection('center')->hasTable('sessions')) {
            return collect();
        }

        $livekitUrl = (string) config('sessions.livekit.url');

        return $tenantDb->table('sessions')
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

    private function attendance(Connection $tenantDb, int $studentId): Collection
    {
        if (! Schema::connection('center')->hasTable('attendances')) {
            return collect();
        }

        return $tenantDb->table('attendances')
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

    private function grades(Connection $tenantDb, int $studentId): Collection
    {
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

        return $grades->sortByDesc('date')->values();
    }

    /**
     * @return array{homework: Collection, options: Collection}
     */
    private function homework(Connection $tenantDb, int $studentId, int $gradeId, int $classId, int $sectionId): array
    {
        if (! Schema::connection('center')->hasTable('homeworks')) {
            return ['homework' => collect(), 'options' => collect()];
        }

        $homeworks = $tenantDb->table('homeworks')
            ->where('grade_id', $gradeId)
            ->where('class_id', $classId)
            ->where('section_id', $sectionId)
            ->orderByDesc('due_date')
            ->limit(300)
            ->get(['id', 'title', 'due_date']);

        $homeworkOptions = $homeworks->map(fn ($h) => ['id' => (int) $h->id, 'title' => $h->title])->values();

        if (! Schema::connection('center')->hasTable('student_homework')) {
            return [
                'homework' => $homeworks->map(fn ($row) => [
                    'id' => 'h-'.$row->id,
                    'submission_id' => null,
                    'homework_id' => (int) $row->id,
                    'title' => $row->title,
                    'subject' => 'Homework',
                    'due_date' => (string) $row->due_date,
                    'status' => 'not_submitted',
                    'grade' => '—',
                    'student_notes' => '',
                    'response' => '',
                ])->values(),
                'options' => $homeworkOptions,
            ];
        }

        $submissions = $tenantDb->table('student_homework')->where('student_id', $studentId)->get()->keyBy('homework_id');
        $homework = $homeworks->map(function ($row) use ($submissions) {
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
                'title' => $row->title,
                'subject' => 'Homework',
                'due_date' => (string) $row->due_date,
                'status' => $submission->status ?? 'not_submitted',
                'grade' => $submission->degree ?? '—',
                'student_notes' => $submission->student_notes ?? '',
                'response' => $submission->response ?? '',
                'file_url' => $fileUrl,
                'file_name' => $fileName,
                'correction_url' => $correctionUrl,
                'correction_name' => $correctionName,
                'upload_date' => $submission && $submission->upload_date_time
                    ? (string) $submission->upload_date_time
                    : '',
            ];
        })->values();

        return ['homework' => $homework, 'options' => $homeworkOptions];
    }

    private function library(Connection $tenantDb, int $gradeId, int $classId, int $sectionId): Collection
    {
        if (! Schema::connection('center')->hasTable('library')) {
            return collect();
        }

        return $tenantDb->table('library')
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

    private function certifications(Connection $tenantDb, int $studentId): Collection
    {
        if (! Schema::connection('center')->hasTable('student_certifications')) {
            return collect();
        }

        return $tenantDb->table('student_certifications')
            ->where('student_id', $studentId)
            ->orderByDesc('issued_at')
            ->limit(200)
            ->get(['id', 'template_id', 'title', 'content', 'variables', 'design', 'context', 'context_date', 'issued_at', 'is_custom'])
            ->map(function ($row) {
                return [
                    'id' => (int) $row->id,
                    'template_id' => $row->template_id ? (int) $row->template_id : null,
                    'title' => $row->title,
                    'content' => $row->content,
                    'design' => $row->design ? json_decode((string) $row->design, true) : null,
                    'context' => $row->context ?? 'manual',
                    'context_date' => $row->context_date ? (string) $row->context_date : null,
                    'issued_at' => $row->issued_at ? (string) $row->issued_at : null,
                    'is_custom' => (bool) ($row->is_custom ?? false),
                ];
            })
            ->values();
    }

    private function announcements(Connection $tenantDb, int $gradeId, int $classId, int $sectionId): Collection
    {
        if (! Schema::connection('center')->hasTable('announcements')) {
            return collect();
        }

        $query = $tenantDb->table('announcements')
            ->where('grade_id', $gradeId)
            ->where('class_id', $classId)
            ->where('section_id', $sectionId)
            ->orderByDesc('id')
            ->limit(50);

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
                'type' => $row->announcement_type ?: 'others',
                'created_at' => $row->created_at ? (string) $row->created_at : null,
            ])
            ->values();
    }

    private function fees(Connection $tenantDb, int $studentId): Collection
    {
        if (! Schema::connection('center')->hasTable('payments')) {
            return collect();
        }

        return $tenantDb->table('payments')
            ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
            ->where('payments.student_id', $studentId)
            ->orderByDesc('payments.payment_date')
            ->orderByDesc('payments.id')
            ->limit(100)
            ->get([
                'payments.id',
                'payments.payment_date',
                'payments.payment_status',
                'payments.amount',
                'payments.month',
                'fees.title as fee_title',
            ])
            ->map(function ($row) {
                $status = isset($row->payment_status) && (int) $row->payment_status === 1 ? 'paid' : 'unpaid';

                return [
                    'id' => (int) $row->id,
                    'item' => $row->fee_title ?: ('Fee '.($row->month ?? '')),
                    'amount' => (float) ($row->amount ?? 0),
                    'status' => $status,
                    'due_date' => $row->payment_date ?? now()->toDateString(),
                    'month' => $row->month ?? '',
                ];
            })
            ->values();
    }
}
