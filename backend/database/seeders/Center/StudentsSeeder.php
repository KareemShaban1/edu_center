<?php

namespace Database\Seeders\Center;

use App\Models\Platform\CenterMembership;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class StudentsSeeder extends Seeder
{
    use ClearsCenterMembershipProfiles;

    public function run()
    {
        $this->clearProfilesForCenter('students', \App\Models\Student::class);

        $students = new Student();
        $students->name = 'كريم شعبان';
        $students->code = 'STU-000001';
        $students->email = 'student@educenter.com';
        $students->password = Hash::make('password');
        $students->gender = 'male';
        $students->grade_id = 3;
        $students->class_id = 9;
        $students->section_id = 9;
        $students->parent_id = 1;
        $students->academic_year = '2025';
        $students->save();

        $faker = \Faker\Factory::create('ar_SA');
        $parentMin = 1;
        $parentMax = 101;

        for ($i = 0; $i < 200; $i++) {
            $student = new Student();
            $student->name = $faker->name();
            $student->code = 'STU-'.str_pad((string) ($i + 2), 6, '0', STR_PAD_LEFT);
            $student->email = $faker->unique()->safeEmail;
            $student->password = Hash::make('password');
            $student->gender = $faker->randomElement(['male', 'female']);
            $section = Section::inRandomOrder()->first();
            if (! $section) {
                continue;
            }

            $student->section_id = $section->id;
            $student->class_id = $section->class_id;
            $student->grade_id = $section->grade_id;
            $student->parent_id = $faker->numberBetween($parentMin, $parentMax);
            $student->academic_year = '2025';
            $student->save();
        }
    }
}
