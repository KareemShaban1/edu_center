<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DashboardDataSeeder extends Seeder
{
    use CenterSeederSupport;

    private const SESSION_DAYS = 5;

    /** @var array<string, bool> */
    private array $columnCache = [];

    public function run(): void
    {
        foreach ([
            'payments',
            'fees',
            'attendances',
            'exam_degrees',
            'quiz_degrees',
            'student_homework',
            'homeworks',
            'announcements',
            'sessions',
        ] as $table) {
            if (Schema::connection('mysql')->hasTable($table)) {
                $this->scopedDelete($table);
            }
        }

        if (! Schema::connection('mysql')->hasTable('sessions')) {
            return;
        }

        $centerId = $this->centerId();
        $fallbackTeacherId = (int) (Teacher::query()->orderBy('id')->value('id') ?? 0);
        $fallbackTeacherEmail = (string) (Teacher::query()->orderBy('id')->value('email') ?? 'Admin');

        $sections = Section::query()
            ->orderBy('grade_id')
            ->orderBy('class_id')
            ->orderBy('id')
            ->get(['id', 'grade_id', 'class_id', 'section_name']);

        if ($sections->isEmpty()) {
            return;
        }

        $now = now();
        $monthName = strtolower($now->format('F'));
        $year = (string) $now->year;
        $attendanceRows = [];
        $paymentRows = [];
        $announcementRows = [];

        foreach ($sections as $sectionIndex => $section) {
            $students = Student::query()
                ->where('section_id', $section->id)
                ->orderBy('id')
                ->get(['id', 'grade_id', 'class_id', 'section_id', 'name']);

            if ($students->isEmpty()) {
                continue;
            }

            [$teacherId, $teacherEmail] = $this->resolveSectionTeacher($section->id, $fallbackTeacherId, $fallbackTeacherEmail);
            $sessionsByDate = $this->seedSectionSessions($section, $teacherId, $teacherEmail, $now, $sectionIndex);

            $feeId = $this->insertFee($section, $monthName, $year);
            $this->insertHomeworks($section, $teacherId, $now, $sectionIndex);

            foreach ($students->values() as $studentIndex => $student) {
                $this->seedAttendance($attendanceRows, $student, $teacherId, $now, $studentIndex, $sessionsByDate);
                $this->seedExam($student, $now, $studentIndex, $sessionsByDate);
                $this->seedQuiz($student, $now, $studentIndex, $sessionsByDate);
                $this->seedPayment($paymentRows, $student, $feeId, $monthName, $now, $studentIndex);
                $this->seedStudentHomework($student, $section->id, $now, $studentIndex);
            }

            if ($sectionIndex < 3) {
                $announcementRows[] = [
                    'grade_id' => $section->grade_id,
                    'class_id' => $section->class_id,
                    'section_id' => $section->id,
                    'title' => 'إعلان '.$section->section_name,
                    'body' => 'تنبيه للطلاب وأولياء الأمور بخصوص الأنشطة والامتحانات القادمة.',
                    'time' => $now->copy()->subDays($sectionIndex + 1),
                    'announcement_type' => $sectionIndex === 0 ? 'exam' : ($sectionIndex === 1 ? 'quiz' : 'others'),
                    'center_id' => $centerId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        if ($attendanceRows !== []) {
            DB::connection('mysql')->table('attendances')->insert($attendanceRows);
        }

        if ($paymentRows !== []) {
            DB::connection('mysql')->table('payments')->insert($paymentRows);
        }

        if ($announcementRows !== []) {
            DB::connection('mysql')->table('announcements')->insert($announcementRows);
        }
    }

    /**
     * @return array{0: int, 1: string}
     */
    private function resolveSectionTeacher(int $sectionId, int $fallbackTeacherId, string $fallbackTeacherEmail): array
    {
        if (! Schema::connection('mysql')->hasTable('teacher_section')) {
            return [$fallbackTeacherId, $fallbackTeacherEmail];
        }

        $teacherId = (int) (DB::connection('mysql')->table('teacher_section')
            ->where('section_id', $sectionId)
            ->orderBy('teacher_id')
            ->value('teacher_id') ?? $fallbackTeacherId);

        if ($teacherId <= 0) {
            return [$fallbackTeacherId, $fallbackTeacherEmail];
        }

        $email = (string) (Teacher::query()->where('id', $teacherId)->value('email') ?? $fallbackTeacherEmail);

        return [$teacherId, $email !== '' ? $email : $fallbackTeacherEmail];
    }

    /**
     * @return array<string, array{id: int, start_at: Carbon, session_type: string, latitude: ?float, longitude: ?float}>
     */
    private function seedSectionSessions(object $section, int $teacherId, string $teacherEmail, Carbon $now, int $sectionIndex): array
    {
        $topics = [
            'حصة اللغة الإنجليزية',
            'حصة الرياضيات',
            'حصة العلوم',
            'مراجعة عامة',
            'اختبار قصير',
        ];

        $hourSlots = [15, 17, 19];
        $startHour = $hourSlots[$sectionIndex % count($hourSlots)];
        $baseLat = 30.0444 + ($section->id * 0.0007);
        $baseLng = 31.2357 + ($section->id * 0.0007);

        $sessionsByDate = [];

        for ($day = 0; $day < self::SESSION_DAYS; $day++) {
            $sessionDate = $now->copy()->subDays($day)->startOfDay();
            $startAt = $sessionDate->copy()->setTime($startHour, 0, 0);
            $isOffline = $day % 2 === 0;
            $topic = $topics[$day % count($topics)];

            $row = [
                'grade_id' => $section->grade_id,
                'class_id' => $section->class_id,
                'section_id' => $section->id,
                'created_by' => $teacherEmail,
                'topic' => $topic.' — '.$section->section_name,
                'session_type' => $isOffline ? 'offline' : 'online',
                'provider' => $isOffline ? null : 'jitsi',
                'start_at' => $startAt,
                'duration' => 90,
                'room_slug' => $isOffline ? null : sprintf('seed-%d-%d', $section->id, $day),
                'join_url' => $isOffline ? '#' : sprintf('https://meet.jit.si/edu-%d-%d', $section->id, $day),
                'moderator_url' => null,
                'password' => null,
                'record_enabled' => false,
                'external_ref' => null,
                'location' => $isOffline ? 'قاعة '.$section->section_name : null,
                'notes' => $isOffline ? 'حصة حضورية' : 'حصة أونلاين',
                'center_id' => $this->centerId(),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($this->hasColumn('sessions', 'latitude')) {
                $row['latitude'] = $isOffline ? round($baseLat, 7) : null;
                $row['longitude'] = $isOffline ? round($baseLng, 7) : null;
                $row['geofence_radius_m'] = $isOffline ? 150 : null;
            }

            $sessionId = (int) DB::connection('mysql')->table('sessions')->insertGetId($row);
            $dateKey = $sessionDate->toDateString();

            $sessionsByDate[$dateKey] = [
                'id' => $sessionId,
                'start_at' => $startAt,
                'session_type' => $isOffline ? 'offline' : 'online',
                'latitude' => $isOffline ? $baseLat : null,
                'longitude' => $isOffline ? $baseLng : null,
            ];
        }

        return $sessionsByDate;
    }

    private function insertFee(object $section, string $monthName, string $year): int
    {
        $row = [
            'title' => 'رسوم شهرية',
            'amount' => 250.00,
            'grade_id' => $section->grade_id,
            'class_id' => $section->class_id,
            'section_id' => $section->id,
            'description' => 'Monthly tuition',
            'year' => $year,
            'month' => $monthName,
            'fee_type' => 'monthly',
            'center_id' => $this->centerId(),
            'created_at' => now(),
            'updated_at' => now(),
        ];

        return (int) DB::connection('mysql')->table('fees')->insertGetId($row);
    }

    private function insertHomeworks(object $section, int $teacherId, Carbon $now, int $sectionIndex): void
    {
        $titles = [
            'واجب الرياضيات - '.$section->section_name,
            'واجب العلوم - تقرير مختبر',
        ];

        foreach ($titles as $offset => $title) {
            DB::connection('mysql')->table('homeworks')->insert([
                'title' => $title,
                'content' => 'يرجى إنجاز الواجب قبل الموعد المحدد.',
                'grade_id' => $section->grade_id,
                'class_id' => $section->class_id,
                'section_id' => $section->id,
                'submit_date' => $now->copy()->subDays(2),
                'due_date' => $now->copy()->addDays($offset + 3),
                'final_degree' => '10',
                'center_id' => $this->centerId(),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    private function seedStudentHomework(object $student, int $sectionId, Carbon $now, int $studentIndex): void
    {
        if (! Schema::connection('mysql')->hasTable('student_homework')) {
            return;
        }

        $homeworkIds = DB::connection('mysql')->table('homeworks')
            ->where('section_id', $sectionId)
            ->orderBy('id')
            ->pluck('id');

        $rates = ['Excellent', 'Very Good', 'Good'];

        foreach ($homeworkIds->values() as $homeworkIndex => $homeworkId) {
            $status = match (($studentIndex + $homeworkIndex) % 4) {
                0 => 'not_submitted',
                1 => 'submitted',
                2 => 'approved',
                default => 'late',
            };

            if ($status === 'not_submitted') {
                continue;
            }

            $row = [
                'student_id' => $student->id,
                'homework_id' => $homeworkId,
                'upload_date_time' => $now->copy()->subDays(1 + $homeworkIndex),
                'status' => $status,
                'degree' => $status === 'approved' ? (string) (7 + (($studentIndex + $homeworkIndex) % 3)) : null,
                'rate' => $status === 'approved' ? $rates[($studentIndex + $homeworkIndex) % count($rates)] : null,
                'student_notes' => 'تم إرسال الواجب.',
                'response' => $status === 'approved' ? 'عمل جيد، استمر.' : null,
                'center_id' => $this->centerId(),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            DB::connection('mysql')->table('student_homework')->insert($row);
        }
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @param  array<string, array{id: int, start_at: Carbon, session_type: string, latitude: ?float, longitude: ?float}>  $sessionsByDate
     */
    private function seedAttendance(
        array &$rows,
        object $student,
        int $teacherId,
        Carbon $now,
        int $studentIndex,
        array $sessionsByDate,
    ): void {
        for ($day = 0; $day < self::SESSION_DAYS; $day++) {
            $attendanceDate = $now->copy()->subDays($day)->toDateString();
            $session = $sessionsByDate[$attendanceDate] ?? null;

            if (! $session) {
                continue;
            }

            $status = match (($studentIndex + $day) % 5) {
                0, 1, 2 => 1,
                3 => 2,
                default => 0,
            };

            $row = [
                'student_id' => $student->id,
                'grade_id' => $student->grade_id,
                'class_id' => $student->class_id,
                'section_id' => $student->section_id,
                'teacher_id' => $teacherId ?: null,
                'attendance_date' => $attendanceDate,
                'attendance_status' => $status,
                'notes' => null,
                'center_id' => $this->centerId(),
                'created_at' => $now,
                'updated_at' => $now,
            ];

            if ($this->hasColumn('attendances', 'session_id')) {
                $row['session_id'] = $session['id'];
            }

            $usedQr = $status !== 0
                && $session['session_type'] === 'offline'
                && ($studentIndex + $day) % 4 !== 0;

            if ($usedQr && $this->hasColumn('attendances', 'checked_in_at')) {
                $checkedInAt = $session['start_at']->copy()->addMinutes(3 + ($studentIndex % 10));
                $row['checked_in_at'] = $checkedInAt;
                $row['check_in_method'] = 'qr';
                $row['check_in_latitude'] = round(($session['latitude'] ?? 30.0444) + 0.00005 * ($studentIndex + 1), 7);
                $row['check_in_longitude'] = round(($session['longitude'] ?? 31.2357) + 0.00005 * ($studentIndex + 1), 7);
                $row['check_in_accuracy_m'] = 8 + ($studentIndex % 12);
                $row['check_in_distance_m'] = 10 + ($studentIndex % 35);
            }

            $rows[] = $row;
        }
    }

    /**
     * @param  array<string, array{id: int, start_at: Carbon, session_type: string, latitude: ?float, longitude: ?float}>  $sessionsByDate
     */
    private function seedExam(object $student, Carbon $now, int $studentIndex, array $sessionsByDate): void
    {
        if ($studentIndex % 2 !== 0) {
            return;
        }

        $examDate = $now->copy()->subDays($studentIndex % 7 + 1)->toDateString();
        $session = $sessionsByDate[$examDate] ?? null;

        $row = [
            'student_id' => $student->id,
            'grade_id' => $student->grade_id,
            'class_id' => $student->class_id,
            'section_id' => $student->section_id,
            'attendance_status' => 'present',
            'exam_date' => $examDate,
            'degree' => (string) (75 + ($studentIndex % 20)),
            'notes' => null,
            'center_id' => $this->centerId(),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        if ($session && $this->hasColumn('exam_degrees', 'session_id')) {
            $row['session_id'] = $session['id'];
        }

        DB::connection('mysql')->table('exam_degrees')->insert($row);
    }

    /**
     * @param  array<string, array{id: int, start_at: Carbon, session_type: string, latitude: ?float, longitude: ?float}>  $sessionsByDate
     */
    private function seedQuiz(object $student, Carbon $now, int $studentIndex, array $sessionsByDate): void
    {
        if ($studentIndex % 3 !== 0) {
            return;
        }

        $quizDate = $now->copy()->subDays($studentIndex % 5 + 1)->toDateString();
        $session = $sessionsByDate[$quizDate] ?? null;

        $row = [
            'student_id' => $student->id,
            'grade_id' => $student->grade_id,
            'class_id' => $student->class_id,
            'section_id' => $student->section_id,
            'attendance_status' => 'present',
            'quiz_date' => $quizDate,
            'degree' => (string) (6 + ($studentIndex % 5)),
            'notes' => null,
            'center_id' => $this->centerId(),
            'created_at' => $now,
            'updated_at' => $now,
        ];

        if ($session && $this->hasColumn('quiz_degrees', 'session_id')) {
            $row['session_id'] = $session['id'];
        }

        DB::connection('mysql')->table('quiz_degrees')->insert($row);
    }

    /** @param  list<array<string, mixed>>  $rows */
    private function seedPayment(array &$rows, object $student, int $feeId, string $monthName, Carbon $now, int $studentIndex): void
    {
        $isPaid = ($studentIndex % 10) < 7;

        $rows[] = [
            'payment_date' => $now->copy()->subDays($studentIndex % 4)->toDateString(),
            'student_id' => $student->id,
            'grade_id' => $student->grade_id,
            'class_id' => $student->class_id,
            'section_id' => $student->section_id,
            'fee_id' => $feeId,
            'payment_status' => $isPaid ? 1 : 0,
            'month' => $monthName,
            'amount' => 250.00,
            'notes' => $isPaid ? 'Paid' : 'Pending',
            'center_id' => $this->centerId(),
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }

    private function hasColumn(string $table, string $column): bool
    {
        $key = $table.'.'.$column;
        if (! array_key_exists($key, $this->columnCache)) {
            $this->columnCache[$key] = Schema::connection('mysql')->hasColumn($table, $column);
        }

        return $this->columnCache[$key];
    }
}
