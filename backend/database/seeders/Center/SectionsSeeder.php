<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Classes;
use App\Models\Grade;
use App\Models\Section;
use Illuminate\Database\Seeder;

class SectionsSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        $this->scopedDelete('teacher_section');
        Section::query()->delete();

        $sectionNames = [
            'مجموعة الساعة 3',
            'مجموعة الساعة 5',
            'مجموعة الساعة 7',
        ];

        Grade::query()->orderBy('id')->each(function (Grade $grade) use ($sectionNames) {
            Classes::query()
                ->where('grade_id', $grade->id)
                ->orderBy('id')
                ->each(function (Classes $class) use ($sectionNames) {
                    foreach ($sectionNames as $sectionName) {
                        Section::create([
                            'section_name' => $sectionName,
                            'status' => 1,
                            'grade_id' => $class->grade_id,
                            'class_id' => $class->id,
                        ]);
                    }
                });
        });
    }
}
