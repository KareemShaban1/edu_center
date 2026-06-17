<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Classes;
use App\Models\Gender;
use App\Models\Grade;
use App\Models\Section;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/** Minimal grade/class/section tree required for a default student account. */
class MinimalStructureSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::connection('center')->table('genders')->count() === 0) {
            Gender::create(['Name' => ['en' => 'Male', 'ar' => 'ذكر']]);
            Gender::create(['Name' => ['en' => 'Female', 'ar' => 'انثي']]);
        }

        if (Grade::query()->count() === 0) {
            Grade::create(['grade_name' => 'المرحلة الابتدائية']);
        }

        $gradeId = (int) Grade::query()->value('id');

        if (Classes::query()->count() === 0) {
            Classes::create([
                'class_name' => 'الصف الأول',
                'grade_id' => $gradeId,
            ]);
        }

        $classId = (int) Classes::query()->value('id');

        if (Section::query()->count() === 0) {
            Section::create([
                'section_name' => 'المجموعة الأولى',
                'status' => 1,
                'grade_id' => $gradeId,
                'class_id' => $classId,
            ]);
        }
    }
}
