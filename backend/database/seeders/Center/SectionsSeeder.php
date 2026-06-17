<?php

namespace Database\Seeders\Center;
use App\Models\Classroom;
use App\Models\Grade;
use App\Models\Section;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SectionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        Section::query()->delete();

        $Sections = [
            'مجموعة الساعة 3',
            'مجموعة الساعة 5',
            'مجموعة الساعة 7',
        ];

        foreach ($Sections as $section) {
            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 1,
                'class_id' => 1
            ]);
            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 1,
                'class_id' => 2
            ]);
            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 1,
                'class_id' => 3
            ]);


            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 2,
                'class_id' => 4
            ]);

            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 2,
                'class_id' => 5
            ]);

            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 2,
                'class_id' => 6
            ]);


            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 3,
                'class_id' => 7
            ]);

            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 3,
                'class_id' => 8
            ]);

            Section::create([
                'section_name' => $section,
                'status' => 1,
                'grade_id' => 3,
                'class_id' => 9
            ]);
        }
    }
}
