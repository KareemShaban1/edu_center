<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Grade;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        Grade::query()->delete();

        foreach ([
            'المرحلة الابتدائية',
            'المرحلة الاعدادية',
            'المرحلة الثانوية',
        ] as $grade) {
            Grade::create(['grade_name' => $grade]);
        }
    }
}
