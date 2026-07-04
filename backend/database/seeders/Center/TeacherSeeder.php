<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Section;
use App\Models\Teacher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TeacherSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        $this->scopedDelete('teacher_section');
        Teacher::query()->delete();

        $teachers = [
            [
                'email' => $this->roleEmail('teacher', 1),
                'name' => 'أ. محمد حسن',
                'subject' => 'English',
            ],
            [
                'email' => $this->roleEmail('teacher', 2),
                'name' => 'أ. سارة علي',
                'subject' => 'Mathematics',
            ],
            [
                'email' => $this->roleEmail('teacher', 3),
                'name' => 'أ. أحمد يوسف',
                'subject' => 'Science',
            ],
        ];

        $teacherIds = [];

        foreach ($teachers as $index => $row) {
            $teacher = Teacher::create([
                'name' => $row['name'],
                'email' => $row['email'],
                'password' => Hash::make('password'),
                'subject' => $row['subject'],
                'address' => 'Main Branch',
                'phone' => $this->parentPhone(9000 + $index + 1),
                'gender' => $index === 1 ? 'female' : 'male',
                'joining_date' => now()->subMonths(6 - $index),
            ]);

            $teacherIds[] = (int) $teacher->id;
        }

        $primaryTeacherId = $teacherIds[0] ?? 0;
        $sections = Section::query()->orderBy('id')->pluck('id');

        foreach ($sections->values() as $index => $sectionId) {
            $teacherId = $teacherIds[$index % max(count($teacherIds), 1)] ?? $primaryTeacherId;

            DB::connection('mysql')->table('teacher_section')->insert([
                'teacher_id' => $teacherId,
                'section_id' => $sectionId,
                'center_id' => $this->centerId(),
            ]);
        }

        if ($primaryTeacherId > 0) {
            foreach ($sections as $sectionId) {
                $alreadyPrimary = DB::connection('mysql')->table('teacher_section')
                    ->where('teacher_id', $primaryTeacherId)
                    ->where('section_id', $sectionId)
                    ->exists();

                if ($alreadyPrimary) {
                    continue;
                }

                DB::connection('mysql')->table('teacher_section')->insert([
                    'teacher_id' => $primaryTeacherId,
                    'section_id' => $sectionId,
                    'center_id' => $this->centerId(),
                ]);
            }
        }
    }
}
