<?php

declare(strict_types=1);

namespace App\Http\Support;

use App\Centers\CenterContext;
use App\Centers\CenterContextManager;
use App\Centers\CenterMembershipService;
use App\Models\Library;
use App\Models\StudentHomework;
use App\Models\Platform\Center;
use App\Models\Platform\CenterMembership;
use App\Models\Parents;
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
        $homework = collect();

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
            $homework = $homework->merge(collect($block['homework'] ?? [])->map($tag));
        }

        $childKey = fn (array $row): string => ($row['center_id'] ?? '0').':'.($row['id'] ?? '0');
        $reportKey = fn (array $row): string => ($row['center_id'] ?? '0').':'.($row['student_id'] ?? '0');
        $recordKey = fn (array $row): string => ($row['center_id'] ?? '0').':'.($row['id'] ?? '0').':'.($row['student_id'] ?? '0');

        return [
            'centers' => $centers,
            'children' => $children->unique($childKey)->values()->all(),
            'attendance' => $attendance->unique($recordKey)->values()->all(),
            'fees' => $fees->unique($recordKey)->values()->all(),
            'quizzes' => $quizzes->unique($recordKey)->values()->all(),
            'exams' => $exams->unique($recordKey)->values()->all(),
            'reports' => $reports->unique($reportKey)->values()->all(),
            'homework' => $homework->unique($recordKey)->values()->all(),
        ];
    }

    /** @return array{children: list<array<string, mixed>>, attendance: list<array<string, mixed>>, fees: list<array<string, mixed>>, quizzes: list<array<string, mixed>>, exams: list<array<string, mixed>>, reports: list<array<string, mixed>>} */
    public function parentBootstrap(int $authParentId): array
    {
        return $this->parentBootstrapData($this->resolveParentProfileIds($authParentId));
    }

    /** @return list<int> */
    public function resolveParentProfileIds(int $parentId): array
    {
        $db = $this->centralDb();
        if (! Schema::connection('center')->hasTable('parents')) {
            return [$parentId];
        }

        $email = $db->table('parents')->where('id', $parentId)->value('email');
        if (! is_string($email) || trim($email) === '') {
            return [$parentId];
        }

        $ids = $db->table('parents')
            ->where('email', $email)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        return $ids !== [] ? $ids : [$parentId];
    }

    public function studentPortal(string $email, string $userType): array
    {
        $memberships = $this->assignedMemberships($email, $userType);

        $centers = [];
        $profiles = collect();
        $sessions = collect();
        $attendance = collect();
        $grades = collect();
        $homework = collect();
        $library = collect();
        $announcements = collect();
        $fees = collect();
        $certifications = collect();

        foreach ($memberships as $membership) {
            $center = Center::query()->find($membership->center_id);
            if (! $center) {
                continue;
            }

            $block = $this->studentCenterBlock($center, (int) $membership->user_id);
            $centers[] = $this->buildStudentCenterSummary($center, (int) $membership->user_id, (int) $membership->id, $block);

            $tag = fn (array $row): array => array_merge($row, [
                'center_id' => $center->id,
                'center_slug' => $center->slug,
                'center_name' => $center->name,
            ]);

            if ($block['profile']) {
                $profiles->push($tag($block['profile']));
            }
            $sessions = $sessions->merge(collect($block['sessions'])->map($tag));
            $attendance = $attendance->merge(collect($block['attendance'])->map($tag));
            $grades = $grades->merge(collect($block['grades'])->map($tag));
            $homework = $homework->merge(collect($block['homework'])->map($tag));
            $library = $library->merge(collect($block['library'])->map($tag));
            $announcements = $announcements->merge(collect($block['announcements'] ?? [])->map($tag));
            $fees = $fees->merge(collect($block['fees'] ?? [])->map($tag));
            $certifications = $certifications->merge(collect($block['certifications'] ?? [])->map($tag));
        }

        return [
            'centers' => $centers,
            'profiles' => $profiles->values()->all(),
            'sessions' => $sessions->values()->all(),
            'attendance' => $attendance->values()->all(),
            'grades' => $grades->values()->all(),
            'homework' => $homework->values()->all(),
            'library' => $library->values()->all(),
            'announcements' => $announcements->values()->all(),
            'fees' => $fees->values()->all(),
            'certifications' => $certifications->values()->all(),
        ];
    }

    /** @return array<string, mixed> */
    protected function parentCenterBlock(Center $center, int $parentId): array
    {
        $this->centerContext->initialize($center);

        try {
            return $this->parentBootstrapData($this->resolveParentProfileIds($parentId));
        } finally {
            $this->centerContext->end();
        }
    }

    /**
     * @param  list<int>  $parentIds
     * @return array{children: list<array<string, mixed>>, attendance: list<array<string, mixed>>, fees: list<array<string, mixed>>, quizzes: list<array<string, mixed>>, exams: list<array<string, mixed>>, reports: list<array<string, mixed>>}
     */
    protected function parentBootstrapData(array $parentIds): array
    {
        $central = $this->centralDb();
        $scoped = DB::connection('center');
        $centerId = CenterContext::id();
        $has = fn (string $table): bool => Schema::connection('center')->hasTable($table);
        $studentsHasDeletedAt = $has('students')
            && in_array('deleted_at', $central->getSchemaBuilder()->getColumnListing('students'), true);

        $children = collect();
        if ($parentIds !== [] && $has('students')) {
            $childrenQuery = $central->table('students')
                ->leftJoin('grades', function ($join) use ($centerId) {
                    $join->on('students.grade_id', '=', 'grades.id');
                    if ($centerId) {
                        $join->where('grades.center_id', '=', $centerId);
                    }
                })
                ->leftJoin('classes', function ($join) use ($centerId) {
                    $join->on('students.class_id', '=', 'classes.id');
                    if ($centerId) {
                        $join->where('classes.center_id', '=', $centerId);
                    }
                })
                ->leftJoin('sections', function ($join) use ($centerId) {
                    $join->on('students.section_id', '=', 'sections.id');
                    if ($centerId) {
                        $join->where('sections.center_id', '=', $centerId);
                    }
                })
                ->whereIn('students.parent_id', $parentIds)
                ->when($studentsHasDeletedAt, fn ($query) => $query->whereNull('students.deleted_at'))
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
                ->orderBy('students.name');

            $children = $childrenQuery->get()
                ->map(fn ($row) => [
                    'id' => (int) $row->id,
                    'name' => $row->name,
                    'grade_id' => (int) ($row->grade_id ?? 0),
                    'class_id' => (int) ($row->class_id ?? 0),
                    'section_id' => (int) ($row->section_id ?? 0),
                    'grade' => $row->grade_name ?: ('Grade '.($row->grade_id ?? '-')),
                    'class' => $row->class_name ?: ('Class '.($row->class_id ?? '-')),
                    'section' => $row->section_name ?: ('Section '.($row->section_id ?? '-')),
                ])
                ->unique('id')
                ->values();
        }

        $childrenIds = $children->pluck('id')->values();
        $childNames = $children->keyBy('id');

        $attendance = collect();
        if ($childrenIds->isNotEmpty() && $has('attendances')) {
            $attendance = $scoped->table('attendances')
                ->whereIn('attendances.student_id', $childrenIds)
                ->orderByDesc('attendances.attendance_date')
                ->limit(500)
                ->get(['attendances.id', 'attendances.student_id', 'attendances.attendance_date', 'attendances.attendance_status'])
                ->map(function ($row) use ($childNames) {
                    $status = ((int) $row->attendance_status) === 1 ? 'present' : (((int) $row->attendance_status) === 2 ? 'late' : 'absent');

                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $childNames->get((int) $row->student_id)['name'] ?? '',
                        'date' => $row->attendance_date,
                        'status' => $status,
                    ];
                })
                ->values();
        }

        $fees = collect();
        if ($childrenIds->isNotEmpty() && $has('payments')) {
            $fees = $scoped->table('payments')
                ->leftJoin('fees', 'payments.fee_id', '=', 'fees.id')
                ->whereIn('payments.student_id', $childrenIds)
                ->orderByDesc('payments.payment_date')
                ->orderByDesc('payments.id')
                ->limit(500)
                ->get([
                    'payments.id',
                    'payments.student_id',
                    'payments.payment_date',
                    'payments.payment_status',
                    'payments.amount',
                    'payments.month',
                    'fees.title as fee_title',
                ])
                ->map(function ($row) use ($childNames) {
                    $status = isset($row->payment_status) && (int) $row->payment_status === 1 ? 'paid' : 'unpaid';

                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $childNames->get((int) $row->student_id)['name'] ?? '',
                        'item' => $row->fee_title ?: ('Fee '.($row->month ?? '')),
                        'amount' => (float) ($row->amount ?? 0),
                        'status' => $status,
                        'due_date' => $row->payment_date ?? now()->toDateString(),
                        'month' => $row->month ?? '',
                    ];
                })
                ->values();
        }

        $quizzes = collect();
        if ($childrenIds->isNotEmpty() && $has('quiz_degrees')) {
            $quizzes = $scoped->table('quiz_degrees')
                ->leftJoin('sections', 'quiz_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'quiz_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'quiz_degrees.grade_id', '=', 'grades.id')
                ->whereIn('quiz_degrees.student_id', $childrenIds)
                ->orderByDesc('quiz_degrees.quiz_date')
                ->limit(500)
                ->get([
                    'quiz_degrees.id',
                    'quiz_degrees.student_id',
                    'quiz_degrees.quiz_date',
                    'quiz_degrees.degree',
                    'quiz_degrees.notes',
                    'quiz_degrees.attendance_status',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                ])
                ->map(function ($row) use ($childNames) {
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $childNames->get((int) $row->student_id)['name'] ?? '',
                        'date' => $row->quiz_date,
                        'degree' => $row->degree !== null ? (float) $row->degree : null,
                        'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                        'notes' => $row->notes ?? '',
                        'grade' => trim(($row->grade_name ? $row->grade_name.' - ' : '').($row->class_name ?? '').' - '.($row->section_name ?? '')),
                    ];
                })
                ->values();
        }

        $exams = collect();
        if ($childrenIds->isNotEmpty() && $has('exam_degrees')) {
            $exams = $scoped->table('exam_degrees')
                ->leftJoin('sections', 'exam_degrees.section_id', '=', 'sections.id')
                ->leftJoin('classes', 'exam_degrees.class_id', '=', 'classes.id')
                ->leftJoin('grades', 'exam_degrees.grade_id', '=', 'grades.id')
                ->whereIn('exam_degrees.student_id', $childrenIds)
                ->orderByDesc('exam_degrees.exam_date')
                ->limit(500)
                ->get([
                    'exam_degrees.id',
                    'exam_degrees.student_id',
                    'exam_degrees.exam_date',
                    'exam_degrees.degree',
                    'exam_degrees.notes',
                    'exam_degrees.attendance_status',
                    'grades.grade_name as grade_name',
                    'classes.class_name as class_name',
                    'sections.section_name as section_name',
                ])
                ->map(function ($row) use ($childNames) {
                    return [
                        'id' => (int) $row->id,
                        'student_id' => (int) $row->student_id,
                        'student_name' => $childNames->get((int) $row->student_id)['name'] ?? '',
                        'date' => $row->exam_date,
                        'degree' => $row->degree !== null ? (float) $row->degree : null,
                        'attendance_status' => in_array($row->attendance_status, ['present', 'absent', 'late'], true) ? $row->attendance_status : 'present',
                        'notes' => $row->notes ?? '',
                        'grade' => trim(($row->grade_name ? $row->grade_name.' - ' : '').($row->class_name ?? '').' - '.($row->section_name ?? '')),
                    ];
                })
                ->values();
        }

        $reports = $children->map(function (array $child) use ($attendance, $fees, $quizzes, $exams) {
            $childAttendance = $attendance->where('student_id', $child['id'])->values();
            $presentCount = $childAttendance->whereIn('status', ['present', 'late'])->count();
            $attendanceRate = $childAttendance->count() > 0
                ? round(($presentCount / $childAttendance->count()) * 100, 1)
                : 0;
            $quizAvg = round((float) $quizzes->where('student_id', $child['id'])->whereNotNull('degree')->avg('degree'), 1);
            $examAvg = round((float) $exams->where('student_id', $child['id'])->whereNotNull('degree')->avg('degree'), 1);
            $paidAmount = (float) $fees->where('student_id', $child['id'])->where('status', 'paid')->sum('amount');
            $pendingAmount = (float) $fees->where('student_id', $child['id'])->whereIn('status', ['pending', 'unpaid'])->sum('amount');

            return [
                'student_id' => $child['id'],
                'student_name' => $child['name'],
                'grade' => trim(($child['grade'] ?? '').' - '.($child['class'] ?? '').' - '.($child['section'] ?? '')),
                'attendance_rate' => $attendanceRate,
                'quiz_average' => $quizAvg > 0 ? $quizAvg : null,
                'exam_average' => $examAvg > 0 ? $examAvg : null,
                'paid_amount' => $paidAmount,
                'pending_amount' => $pendingAmount,
            ];
        })->values();

        $homework = collect();
        if ($children->isNotEmpty() && $has('homeworks')) {
            $submissionsByStudent = $has('student_homework')
                ? $scoped->table('student_homework')
                    ->whereIn('student_id', $childrenIds->all())
                    ->get()
                    ->groupBy(fn ($row) => (int) $row->student_id.':'.(int) $row->homework_id)
                : collect();

            foreach ($children as $child) {
                $gradeId = (int) ($child['grade_id'] ?? 0);
                $classId = (int) ($child['class_id'] ?? 0);
                $sectionId = (int) ($child['section_id'] ?? 0);
                if ($gradeId <= 0 || $classId <= 0 || $sectionId <= 0) {
                    continue;
                }

                $homeworkRows = $scoped->table('homeworks')
                    ->where('grade_id', $gradeId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->orderByDesc('due_date')
                    ->limit(100)
                    ->get(['id', 'title', 'due_date']);

                foreach ($homeworkRows as $row) {
                    $submissionKey = (int) $child['id'].':'.(int) $row->id;
                    $submission = $submissionsByStudent->get($submissionKey)?->first();

                    $homework->push([
                        'id' => $submission ? (int) $submission->id : ('h-'.$child['id'].'-'.$row->id),
                        'homework_id' => (int) $row->id,
                        'student_id' => (int) $child['id'],
                        'student_name' => $child['name'],
                        'title' => $row->title,
                        'due_date' => (string) $row->due_date,
                        'status' => $submission->status ?? 'not_submitted',
                        'grade' => $submission->degree ?? '—',
                    ]);
                }
            }
        }

        return [
            'children' => $children->values()->all(),
            'attendance' => $attendance->all(),
            'fees' => $fees->all(),
            'quizzes' => $quizzes->all(),
            'exams' => $exams->all(),
            'reports' => $reports->all(),
            'homework' => $homework->values()->all(),
        ];
    }

    protected function centralDb(): \Illuminate\Database\Connection
    {
        return DB::connection((string) config('database.default', 'mysql'));
    }

    /** @return array<string, mixed> */
    public function buildStudentCenterSummary(Center $center, int $studentId, ?int $membershipId = null, ?array $block = null): array
    {
        $block ??= $this->studentCenterBlock($center, $studentId);

        return [
            'membership_id' => $membershipId,
            'center_id' => $center->id,
            'center_slug' => $center->slug,
            'center_name' => $center->name,
            'email' => $center->email ?? '',
            'phone' => $center->phone ?? '',
            'address' => $center->address ?? '',
            'city' => $center->city ?? '',
            'profile' => $this->enrichStudentProfile($block['profile'] ?? null),
            'stats' => $this->studentCenterStats($block),
        ];
    }

    /** @param  array<string, mixed>|null  $profile */
    protected function enrichStudentProfile(?array $profile): ?array
    {
        if (! $profile) {
            return null;
        }

        $db = DB::connection('center');
        $gradeName = ! empty($profile['grade_id'])
            ? $db->table('grades')->where('id', (int) $profile['grade_id'])->value('grade_name')
            : null;
        $className = ! empty($profile['class_id'])
            ? $db->table('classes')->where('id', (int) $profile['class_id'])->value('class_name')
            : null;
        $sectionName = ! empty($profile['section_id'])
            ? $db->table('sections')->where('id', (int) $profile['section_id'])->value('section_name')
            : null;

        return array_merge($profile, [
            'grade_name' => $gradeName ? (string) $gradeName : null,
            'class_name' => $className ? (string) $className : null,
            'section_name' => $sectionName ? (string) $sectionName : null,
        ]);
    }

    /** @param  array<string, mixed>  $block */
    protected function studentCenterStats(array $block): array
    {
        $attendance = collect($block['attendance'] ?? []);
        $present = $attendance->filter(fn (array $row): bool => in_array($row['status'] ?? '', ['present', 'late'], true))->count();
        $attendanceRate = $attendance->count() > 0 ? (int) round(($present / $attendance->count()) * 100) : null;

        $grades = collect($block['grades'] ?? []);
        $scored = $grades->filter(fn (array $row): bool => is_numeric($row['score'] ?? null));
        $gpa = $scored->count() > 0 ? round((float) $scored->avg('score'), 1) : null;

        $homework = collect($block['homework'] ?? []);
        $pendingHomework = $homework->filter(
            fn (array $row): bool => ! in_array($row['status'] ?? '', ['submitted', 'graded'], true)
        )->count();

        return [
            'sessions_count' => count($block['sessions'] ?? []),
            'attendance_rate' => $attendanceRate,
            'gpa' => $gpa,
            'pending_homework' => $pendingHomework,
            'library_items' => count($block['library'] ?? []),
        ];
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
                    'sessions' => [],
                    'attendance' => [],
                    'grades' => [],
                    'homework' => [],
                    'library' => [],
                    'announcements' => [],
                    'fees' => [],
                    'certifications' => [],
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

            $sessions = collect();
            if (Schema::connection('center')->hasTable('sessions')) {
                $livekitUrl = (string) config('sessions.livekit.url');
                $sessions = $db->table('sessions')
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

            $announcements = collect();
            if (Schema::connection('center')->hasTable('announcements')) {
                $query = $db->table('announcements')
                    ->where('grade_id', $gradeId)
                    ->where('class_id', $classId)
                    ->where('section_id', $sectionId)
                    ->orderByDesc('id')
                    ->limit(50);
                if (Schema::connection('center')->hasColumn('announcements', 'deleted_at')) {
                    $query->whereNull('deleted_at');
                }
                $announcements = $query
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

            $fees = collect();
            if (Schema::connection('center')->hasTable('payments')) {
                $fees = $db->table('payments')
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

            $certifications = collect();
            if (Schema::connection('center')->hasTable('student_certifications')) {
                $certifications = $db->table('student_certifications')
                    ->where('student_id', $studentId)
                    ->orderByDesc('issued_at')
                    ->limit(200)
                    ->get(['id', 'template_id', 'title', 'content', 'design', 'context', 'context_date', 'issued_at', 'is_custom'])
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

            return [
                'profile' => $profile,
                'sessions' => $sessions->all(),
                'attendance' => $attendance->all(),
                'grades' => $grades->sortByDesc('date')->values()->all(),
                'homework' => $homework->all(),
                'library' => $library->all(),
                'announcements' => $announcements->all(),
                'fees' => $fees->all(),
                'certifications' => $certifications->all(),
            ];
        } finally {
            $this->centerContext->end();
        }
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