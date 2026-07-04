<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardDataSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        foreach (['payments', 'fees', 'attendances', 'homeworks', 'exam_degrees', 'quiz_degrees', 'announcements'] as $table) {
            $this->scopedDelete($table);
        }

        $centerId = $this->centerId();
        $teacherId = (int) (Teacher::query()->orderBy('id')->value('id') ?? 0);
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

            $feeId = $this->insertFee($section, $monthName, $year);

            $this->insertHomeworks($section, $teacherId, $now, $sectionIndex);

            foreach ($students->values() as $studentIndex => $student) {
                $this->seedAttendance($attendanceRows, $student, $teacherId, $now, $studentIndex);
                $this->seedExam($student, $now, $studentIndex);
                $this->seedQuiz($student, $now, $studentIndex);
                $this->seedPayment($paymentRows, $student, $feeId, $monthName, $now, $studentIndex);
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
            'واجب الرياضيات - الفصل '.($sectionIndex + 1),
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

    /** @param  list<array<string, mixed>>  $rows */
    private function seedAttendance(array &$rows, object $student, int $teacherId, Carbon $now, int $studentIndex): void
    {
        for ($day = 0; $day < 5; $day++) {
            $status = match (($studentIndex + $day) % 5) {
                0, 1, 2 => 1,
                3 => 2,
                default => 0,
            };

            $rows[] = [
                'student_id' => $student->id,
                'grade_id' => $student->grade_id,
                'class_id' => $student->class_id,
                'section_id' => $student->section_id,
                'teacher_id' => $teacherId ?: null,
                'attendance_date' => $now->copy()->subDays($day)->toDateString(),
                'attendance_status' => $status,
                'notes' => null,
                'center_id' => $this->centerId(),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }
    }

    private function seedExam(object $student, Carbon $now, int $studentIndex): void
    {
        if ($studentIndex % 2 !== 0) {
            return;
        }

        DB::connection('mysql')->table('exam_degrees')->insert([
            'student_id' => $student->id,
            'grade_id' => $student->grade_id,
            'class_id' => $student->class_id,
            'section_id' => $student->section_id,
            'attendance_status' => 'present',
            'exam_date' => $now->copy()->subDays($studentIndex % 7 + 1)->toDateString(),
            'degree' => (string) (75 + ($studentIndex % 20)),
            'notes' => null,
            'center_id' => $this->centerId(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    private function seedQuiz(object $student, Carbon $now, int $studentIndex): void
    {
        if ($studentIndex % 3 !== 0) {
            return;
        }

        DB::connection('mysql')->table('quiz_degrees')->insert([
            'student_id' => $student->id,
            'grade_id' => $student->grade_id,
            'class_id' => $student->class_id,
            'section_id' => $student->section_id,
            'attendance_status' => 'present',
            'quiz_date' => $now->copy()->subDays($studentIndex % 5 + 1)->toDateString(),
            'degree' => (string) (6 + ($studentIndex % 5)),
            'notes' => null,
            'center_id' => $this->centerId(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
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
}
