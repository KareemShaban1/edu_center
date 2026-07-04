<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Jobs\SetupCenter;
use App\Models\Platform\Center;
use Database\Seeders\Platform\PlatformAdminSeeder;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PlatformAdminSeeder::class);

        $centers = [
            [
                'name' => 'Demo Center',
                'slug' => 'demo',
                'domain' => 'demo',
                'email' => 'demo@platform.com',
                'phone' => '01090537394',
                'address' => 'Benha',
                'city' => 'Benha',
                'status' => 1,
            ],
            [
                'name' => 'Test Center',
                'slug' => 'test',
                'domain' => 'test',
                'email' => 'test@platform.com',
                'phone' => '01090537395',
                'address' => 'Cairo',
                'city' => 'Cairo',
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
                    'city' => $data['city'],
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
