<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Parents;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentsSeeder extends Seeder
{
    use ClearsCenterMembershipProfiles;
    use CenterSeederSupport;

    private const STUDENTS_PER_PARENT = 2;

    public function run(): void
    {
        $this->clearProfilesForCenter('students', Student::class);

        $sections = Section::query()->orderBy('id')->get(['id', 'grade_id', 'class_id']);
        if ($sections->isEmpty()) {
            return;
        }

        $parents = Parents::query()->orderBy('id')->get(['id']);
        if ($parents->isEmpty()) {
            return;
        }

        $faker = \Faker\Factory::create('ar_SA');
        $studentCounter = 1;
        $sectionIndex = 0;
        $sectionCount = $sections->count();

        foreach ($parents as $parent) {
            for ($child = 0; $child < self::STUDENTS_PER_PARENT; $child++) {
                $section = $sections[$sectionIndex % $sectionCount];
                $sectionIndex++;

                $student = new Student();
                $student->name = $faker->name();
                $student->code = $this->studentCode($studentCounter);
                $studentCounter++;

                if ($parent->id === 1 && $child === 0) {
                    $student->name = 'كريم شعبان';
                    $student->email = $this->defaultEmail('student');
                } else {
                    $student->email = $faker->unique()->safeEmail();
                }

                $student->password = Hash::make('password');
                $student->gender = $faker->randomElement(['male', 'female']);
                $student->section_id = $section->id;
                $student->class_id = $section->class_id;
                $student->grade_id = $section->grade_id;
                $student->parent_id = $parent->id;
                $student->academic_year = '2025';
                $student->save();

                $this->registerStudentMembership((int) $student->id);
            }
        }
    }
}
