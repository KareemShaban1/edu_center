<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Jobs\SetupCenter;
use App\Models\Platform\Area;
use App\Models\Platform\City;
use App\Models\Platform\Center;
use Database\Seeders\Platform\LocationSeeder;
use Database\Seeders\Platform\PlatformAdminSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PlatformAdminSeeder::class);
        $this->call(LocationSeeder::class);

        $benhaCity = City::query()->where('name', 'Benha')->first();
        $cairoCity = City::query()->where('name', 'Cairo')->first();
        $benhaArea = Area::query()->where('name', 'Benha Center')->first();
        $nasrArea = Area::query()->where('name', 'Nasr City')->first();

        $centers = [
            [
                'name' => 'Demo Center',
                'slug' => 'demo',
                'domain' => 'demo',
                'email' => 'demo@platform.com',
                'phone' => '01090537394',
                'address' => 'Benha',
                'governorate_id' => $benhaCity?->governorate_id,
                'city_id' => $benhaCity?->id,
                'area_id' => $benhaArea?->id,
                'lat' => 30.4663,
                'long' => 31.1848,
                'status' => 1,
            ],
            [
                'name' => 'Test Center',
                'slug' => 'test',
                'domain' => 'test',
                'email' => 'test@platform.com',
                'phone' => '01090537395',
                'address' => 'Nasr City',
                'governorate_id' => $cairoCity?->governorate_id,
                'city_id' => $cairoCity?->id,
                'area_id' => $nasrArea?->id,
                'lat' => 30.0511,
                'long' => 31.3656,
                'status' => 1,
            ],
        ];

        $seedDemoData = app()->environment('local', 'development', 'testing');

        foreach ($centers as $data) {
            $center = Center::query()->updateOrCreate(
                ['slug' => $data['slug']],
                [
                    'name' => $data['name'],
                    'slug' => $data['slug'],
                    'domain' => $data['domain'],
                    'email' => $data['email'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                    'governorate_id' => $data['governorate_id'],
                    'city_id' => $data['city_id'],
                    'area_id' => $data['area_id'],
                    'lat' => $data['lat'],
                    'long' => $data['long'],
                    'status' => $data['status'],
                    'data' => ['plan' => 'Starter'],
                ]
            );

            SetupCenter::dispatchSync($center, $seedDemoData);
        }

        if ($seedDemoData) {
            $this->command?->info('Seeded demo + test centers with students, parents, teachers, fees, attendance, homework, exams, and quizzes.');
        }
    }
}
