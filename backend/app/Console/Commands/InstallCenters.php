<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class InstallCenters extends Command
{
    protected $signature = 'centers:install {--force : Run migrations without confirmation}';

    protected $description = 'Run all database migrations (single central database schema)';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('Run all database migrations?')) {
            return self::SUCCESS;
        }

        Artisan::call('migrate', ['--force' => true]);
        $this->line(Artisan::output());

        $this->info('Database schema is ready.');

        return self::SUCCESS;
    }
}
