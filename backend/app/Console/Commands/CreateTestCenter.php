<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Jobs\SetupCenter;
use App\Models\Platform\Center;
use Illuminate\Console\Command;

class CreateTestCenter extends Command
{
    protected $signature = 'centers:create-test';

    protected $description = 'Create a demo center for local development';

    public function handle(): int
    {
        if (! app()->environment(['local', 'development'])) {
            $this->warn('Only available in local/development environment.');

            return self::FAILURE;
        }

        $center = Center::query()->updateOrCreate(
            ['slug' => 'demo'],
            [
                'name' => 'Demo Center',
                'slug' => 'demo',
                'domain' => 'demo',
                'email' => 'demo@platform.com',
                'status' => 1,
                'data' => ['plan' => 'Starter'],
            ]
        );

        SetupCenter::dispatchSync($center, withDemoData: true);

        $this->info("Demo center created (slug: {$center->slug}).");

        return self::SUCCESS;
    }
}
