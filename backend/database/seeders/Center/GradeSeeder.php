<?php
namespace Database\Seeders\Center;
use App\Models\Grade;
use Illuminate\Database\Seeder;

class GradeSeeder extends Seeder
{
    public function run()
    {
        Grade::query()->delete();
        $grades = [
            'المرحلة الابتدائية',
            'المرحلة الاعدادية',
            'المرحلة الثانوية',
        ];

        foreach ($grades as $grade) {
            Grade::create(['grade_name' => $grade]);
        }
    }
}
