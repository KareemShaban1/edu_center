<?php

namespace App\Console\Commands;

use App\Models\Platform\Tenant;
use Illuminate\Console\Command;

class CreateTestTenant extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-test-tenant';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        if (app()->environment(['local', 'development'])) {
            $this->info('Creating test tenant ...');
            $tenant1 = Tenant::firstOrCreate(['id' => 'de']);
            $tenant1->domains()->create(['domain' => 'localhost']);
        }
    }
}
