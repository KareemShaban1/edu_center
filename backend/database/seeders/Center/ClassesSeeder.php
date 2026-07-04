<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use App\Models\Classes;
use App\Models\Grade;
use Illuminate\Database\Seeder;

class ClassesSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        $this->scopedDelete('classes');

        $classNames = [
            'الصف الاول',
            'الصف الثاني',
            'الصف الثالث',
        ];

        Grade::query()->orderBy('id')->each(function (Grade $grade) use ($classNames) {
            foreach ($classNames as $className) {
                Classes::create([
                    'class_name' => $className,
                    'grade_id' => $grade->id,
                ]);
            }
        });
    }
}
