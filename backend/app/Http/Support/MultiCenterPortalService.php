<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Centers\CenterContextManager;
use App\Centers\CenterMembershipService;
use App\Models\Library;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MultiCenterPortalService
{
    public function __construct(
        protected CenterContextManager $centerContext,
        protected CenterMembershipService $memberships,
    ) {
    }

    public function parentPortal(string $email, string $userType): array
    {
        $memberships = $this->assignedMemberships($email, $userType);

        $centers = [];
        $children = collect();
        $attendance = collect();
        $fees = collect();
        $quizzes = collect();
        $exams = collect();
        $reports = collect();

        foreach ($memberships as $membership) {
            $center = Center::query()->find($membership->center_id);
            if (! $center) {
                continue;
            }

            $block = $this->parentCenterBlock($center, (int) $membership->user_id);
            $centers[] = array_merge([
                'membership_id' => $membership->id,
                'center_id' => $center->id,
                'center_slug' => $center->slug,
                'center_name' => $center->name,
            ], $block);

            $tag = fn (array $row): array => array_merge($row, [
                'center_id' => $center->id,
                'center_slug' => $center->slug,
                'center_name' => $center->name,
            ]);

            $children = $children->merge(collect($block['children'])->map($tag));
            $attendance = $attendance->merge(collect($block['attendance'])->map($tag));
            $fees = $fees->merge(collect($block['fees'])->map($tag));
            $quizzes = $quizzes->merge(collect($block['quizzes'])->map($tag));
            $exams = $exams->merge(collect($block['exams'])->map($tag));
            $reports = $reports->merge(collect($block['reports'])->map($tag));
        }

        return [
            'centers' => $centers,
            'children' => $children->values()->all(),
            'attendance' => $attendance->values()->all(),
            'fees' => $fees->values()->all(),
            'quizzes' => $quizzes->values()->all(),
            'exams' => $exams->values()->all(),
            'reports' => $reports->values()->all(),
        ];
    }

    public function studentPortal(string $email, string $userType): array
    {
        $memberships = $this->assignedMemberships($email, $userType);

        $centers = [];
        $profiles = collect();
        $meetings = collect();
        $attendance = collect();
        $grades = collect();
        $homework = collect();
        $library = collect();

        foreach ($memberships as $membership) {
            $center = Center::query()->find($membership->center_id);
            if (! $center) {
                continue;
            }

            $block = $this->studentCenterBlock($center, (int) $membership->user_id);
            $centers[] = array_merge([
                'membership_id' => $membership->id,
                'center_id' => $center->id,
                'center_slug' => $center->slug,
                'center_name' => $center->name,
                'profile' => $block['profile'],
            ], collect($block)->except('profile')->all());

            $tag = fn (array $row): array => array_merge($row, [
                'center_id' => $center->id,
                'center_slug' => $center->slug,
                'center_name' => $center->name,
            ]);

            if ($block['profile']) {
                $profiles->push($tag($block['profile']));
            }
            $meetings = $meetings->merge(collect($block['meetings'])->map($tag));
            $attendance = $attendance->merge(collect($block['attendance'])->map($tag));
            $grades = $grades->merge(collect($block['grades'])->map($tag));
            $homework = $homework->merge(collect($block['homework'])->map($tag));
            $library = $library->merge(collect($block['library'])->map($tag));
        }

        return [
            'centers' => $centers,
            'profiles' => $profiles->values()->all(),
            'meetings' => $meetings->values()->all(),
            'attendance' => $attendance->values()->all(),
            'grades' => $grades->values()->all(),
            'homework' => $homework->values()->all(),
            'library' => $library->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    protected function parentCenterBlock(Center $center, int $parentId): array
    {
        $this->centerContext->initialize($center);

        try {
            $db = DB::connection('center');
            $has = fn (string $table): bool => Schema::connection('center')->hasTable($table);

            $children = collect();
            if ($has('students')) {
                $children = $db->table('students')
                    ->leftJoin('grades', 'students.grade_id', '=', 'grades.id')
                    ->leftJoin('classes', 'students.class_id', '=', 'classes.id')
                    ->leftJoin('sections', 'students.section_id', '=', 'sections.id')
                    ->where('students.parent_id', $parentId)
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
                    ->map(fn ($row) => [
                        'id' => (int) $row->id,
                        'name' => $row->name,
                        'grade' => $row->grade_name ?: ('Grade '.($row->grade_id ?? '-')),
                        'class' => $row->class_name ?: ('Class '.($row->class_id ?? '-')),
                        'section' => $row->section_name ?: ('Section '.($row->section_id ?? '-')),
                    ])
                    ->values();
            }

            $childrenIds = $children->pluck('id');

            $attendance = $this->parentAttendance($db, $has, $childrenIds);
            $fees = $this->parentFees($db, $has, $childrenIds);
            $quizzes = $this->parentQuizzes($db, $has, $childrenIds);
            $exams = $this->parentExams($db, $has, $childrenIds);

            $reports = $children->map(function (array $child) use ($attendance, $fees, $quizzes, $exams) {
                $childAttendance = $attendance->where('student_id', $child['id'])->values();
                $presentCount = $childAttendance->whereIn('status', ['present', 'late'])->count();
                $attendanceRate = $childAttendance->count() > 0
                    ? round(($presentCount / $childAttendance->count()) * 100, 1)
                    : 0;

                return [
                    'student_id' => $child['id'],
                    'student_name' => $child['name'],
                    'grade' => trim(($child['grade'] ?? '').' - '.($child['class'] ?? '').' - '.($child['section'] ?? '')),
                    'attendance_rate' => $attendanceRate,
                    'quiz_average' => round((float) $quizzes->where('student_id', $child['id'])->whereNotNull('degree')->avg('degree'), 1) ?: null,
                    'exam_average' => round((float) $exams->where('student_id', $child['id'])->whereNotNull('degree')->avg('degree'), 1) ?: null,
                    'paid_amount' => (float) $fees->where('student_id', $child['id'])->where('status', 'paid')->sum('amount'),
                    'pending_amount' => (float) $fees->where('student_id', $child['id'])->whereIn('status', ['pending', 'unpaid'])->sum('amount'),
                ];
            })->values();

            return [
                'children' => $children->all(),
                'attendance' => $attendance->all(),
                'fees' => $fees->all(),
                'quizzes' => $quizzes->all(),
                'exams' => $exams->all(),
                'reports' => $reports->all(),
            ];
        } finally {
            $this->centerContext->end();
        }
    }

    /** @return array<string, mixed> */
    protected function studentCenterBlock(Center $center, int $studentId): array
    {
        $this->centerContext->initialize($center);

        try {
            $db = DB::connection('center');
            $student = $db->table('students')->where('id', $studentId)->first();
            if (! $student) {
                return [
                    'profile' => null,
                    'meetings' => [],
                    'attendance' => [],
                    'grades' => [],
                    'homework' => [],
                    'library' => [],
                ];
            }

            $gradeId = (int) ($student->grade_id ?? 0);
            $classId = (int) ($student->class_id ?? 0);
            $sectionId = (int) ($student->section_id ?? 0);

            $profile = [
                'id' => (int) $student->id,
                'name' => (string) $student->name,
                'email' => (string) $student->email,
                'grade_id' => $gradeId,
                'class_id' => $classId,
                'section_id' => $sectionId,
            ];

            $meetings = collect();
            if (Schema::connection('center')->hasTable('meetings')) {
                $livekitUrl = (string) config('meetings.livekit.url');
                $meetings = $db->table('meetings')
                    ->where('grade_id', $gradeId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->orderByDesc('start_at')
                    ->get()
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
                            'join_url' => $row->join_url ?? '',
                            'livekit_url' => $provider === 'livekit' ? $livekitUrl : '',
                        ];
                    })
                    ->values();
            }

            $attendance = collect();
            if (Schema::connection('center')->hasTable('attendances')) {
                $attendance = $db->table('attendances')
                    ->where('student_id', $studentId)
                    ->orderByDesc('attendance_date')
                    ->limit(300)
                    ->get()
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
                    $db->table('exam_degrees')->where('student_id', $studentId)->orderByDesc('exam_date')->get()
                        ->map(fn ($row) => [
                            'id' => (int) $row->id,
                            'source' => 'exam',
                            'subject' => 'Exam',
                            'date' => (string) $row->exam_date,
                            'score' => is_numeric($row->degree) ? (float) $row->degree : null,
                            'total' => 100,
                        ])
                );
            }
            if (Schema::connection('center')->hasTable('quiz_degrees')) {
                $grades = $grades->merge(
                    $db->table('quiz_degrees')->where('student_id', $studentId)->orderByDesc('quiz_date')->get()
                        ->map(fn ($row) => [
                            'id' => (int) $row->id,
                            'source' => 'quiz',
                            'subject' => 'Quiz',
                            'date' => (string) $row->quiz_date,
                            'score' => is_numeric($row->degree) ? (float) $row->degree : null,
                            'total' => 20,
                        ])
                );
            }

            $homework = collect();
            if (Schema::connection('center')->hasTable('homeworks')) {
                $homeworkRows = $db->table('homeworks')
                    ->where('grade_id', $gradeId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->orderByDesc('due_date')
                    ->limit(300)
                    ->get();
                $submissions = Schema::connection('center')->hasTable('student_homework')
                    ? $db->table('student_homework')->where('student_id', $studentId)->get()->keyBy('homework_id')
                    : collect();
                $homework = $homeworkRows->map(function ($row) use ($submissions) {
                    $submission = $submissions->get($row->id);

                    return [
                        'id' => $submission ? (int) $submission->id : ('h-'.$row->id),
                        'homework_id' => (int) $row->id,
                        'title' => $row->title,
                        'due_date' => (string) $row->due_date,
                        'status' => $submission->status ?? 'not_submitted',
                    ];
                })->values();
            }

            $library = collect();
            if (Schema::connection('center')->hasTable('library')) {
                $library = $db->table('library')
                    ->where('grade_id', $gradeId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->whereNull('deleted_at')
                    ->orderByDesc('id')
                    ->limit(300)
                    ->get()
                    ->map(function ($row) {
                        $book = Library::query()->find($row->id);

                        return [
                            'id' => (int) $row->id,
                            'title' => $row->title,
                            'type' => $row->type ?: 'resource',
                            'url' => $book?->getFirstMediaUrl('library') ?: null,
                        ];
                    })
                    ->values();
            }

            return [
                'profile' => $profile,
                'meetings' => $meetings->all(),
                'attendance' => $attendance->all(),
                'grades' => $grades->sortByDesc('date')->values()->all(),
                'homework' => $homework->all(),
                'library' => $library->all(),
            ];
        } finally {
            $this->centerContext->end();
        }
    }

    protected function parentAttendance($db, callable $has, Collection $childrenIds): Collection
    {
        if ($childrenIds->isEmpty() || ! $has('attendances')) {
            return collect();
        }

        return $db->table('attendances')
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

    protected function parentFees($db, callable $has, Collection $childrenIds): Collection
    {
        if ($childrenIds->isEmpty() || ! $has('payments')) {
            return collect();
        }

        return $db->table('payments')
            ->join('students', 'payments.student_id', '=', 'students.id')
            ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
            ->whereIn('payments.student_id', $childrenIds)
            ->orderByDesc('payments.payment_date')
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

                return [
                    'id' => (int) $row->id,
                    'student_id' => (int) $row->student_id,
                    'student_name' => $row->student_name ?? '',
                    'item' => $row->fee_title ?: ('Fee '.($row->month ?? '')),
                    'amount' => (float) ($row->amount ?? 0),
                    'status' => in_array($statusRaw, ['paid', 'unpaid'], true) ? $statusRaw : 'pending',
                    'due_date' => $row->payment_date ?? now()->toDateString(),
                ];
            })
            ->values();
    }

    protected function parentQuizzes($db, callable $has, Collection $childrenIds): Collection
    {
        if ($childrenIds->isEmpty() || ! $has('quiz_degrees')) {
            return collect();
        }

        return $db->table('quiz_degrees')
            ->join('students', 'quiz_degrees.student_id', '=', 'students.id')
            ->whereIn('quiz_degrees.student_id', $childrenIds)
            ->orderByDesc('quiz_degrees.quiz_date')
            ->limit(500)
            ->get([
                'quiz_degrees.id',
                'quiz_degrees.student_id',
                'quiz_degrees.quiz_date',
                'quiz_degrees.degree',
                'students.name as student_name',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'student_id' => (int) $row->student_id,
                'student_name' => $row->student_name ?? $row->name ?? '',
                'date' => $row->quiz_date,
                'degree' => $row->degree !== null ? (float) $row->degree : null,
            ])
            ->values();
    }

    protected function parentExams($db, callable $has, Collection $childrenIds): Collection
    {
        if ($childrenIds->isEmpty() || ! $has('exam_degrees')) {
            return collect();
        }

        return $db->table('exam_degrees')
            ->join('students', 'exam_degrees.student_id', '=', 'students.id')
            ->whereIn('exam_degrees.student_id', $childrenIds)
            ->orderByDesc('exam_degrees.exam_date')
            ->limit(500)
            ->get([
                'exam_degrees.id',
                'exam_degrees.student_id',
                'exam_degrees.exam_date',
                'exam_degrees.degree',
                'students.name as student_name',
            ])
            ->map(fn ($row) => [
                'id' => (int) $row->id,
                'student_id' => (int) $row->student_id,
                'student_name' => $row->student_name ?? $row->name ?? '',
                'date' => $row->exam_date,
                'degree' => $row->degree !== null ? (float) $row->degree : null,
            ])
            ->values();
    }

    /** @return \Illuminate\Support\Collection<int, CenterMembership> */
    protected function assignedMemberships(string $email, string $userType): Collection
    {
        $profileIds = DB::connection('center')->table(
            $userType === \App\Models\Student::class ? 'students' : 'parents'
        )->where('email', $email)->pluck('id')->map(fn ($id) => (int) $id)->all();

        if ($profileIds === []) {
            return collect();
        }

        return CenterMembership::query()
            ->where('user_type', $userType)
            ->whereIn('user_id', $profileIds)
            ->where('status', CenterMembership::STATUS_ASSIGNED)
            ->get();
    }
}
