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
                'id' => 'demo',
                'name' => 'Demo Center',
                'slug' => 'demo',
                'domain' => 'demo',
                'email' => 'demo@platform.com',
                'phone' => '01090537394',
                'address' => 'Benha',
                'city' => 'Benha',
                'status' => 1,
            ],
        ];

        $seedDemoData = app()->environment('local', 'development');

        foreach ($centers as $data) {
            $center = Center::query()->updateOrCreate(
                ['id' => $data['id']],
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
            $this->command?->info('Demo center seeded with sample grades, parents, students, and teachers.');
        }
    }
}
