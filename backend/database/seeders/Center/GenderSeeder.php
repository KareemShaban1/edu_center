<?php

declare(strict_types=1);

namespace Database\Seeders\Center;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GenderSeeder extends Seeder
{
    use CenterSeederSupport;

    public function run(): void
    {
        $this->scopedDelete('genders');

        foreach ([
            ['en' => 'Male', 'ar' => 'ذكر'],
            ['en' => 'Female', 'ar' => 'انثي'],
        ] as $gender) {
            $this->insertScopedRow('genders', [
                'Name' => json_encode($gender, JSON_UNESCAPED_UNICODE),
            ]);
        }
    }
}
