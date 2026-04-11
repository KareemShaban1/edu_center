<?php

namespace Database\Seeders;

use App\Models\Platform\Tenant;
use Database\Seeders\Platform\PlatformAdminSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $this->call(PlatformAdminSeeder::class);
        // $this->call(TenantSeeder::class);


        $tenants = [
            // ['id' => 'test', 'name' => 'Test Center', 'domain' => 'test', 'email' => 'test@platform.com', 'phone' => '01090537394', 'address' => 'Benha', 'city' => 'Benha', 'subdomain' => 'test', 'status' => 1],
            ['id' => 'demo', 'name' => 'Demo Center', 'domain' => 'demo', 'email' => 'demo@platform.com', 'phone' => '01090537394', 'address' => 'Benha', 'city' => 'Benha', 'subdomain' => 'demo', 'status' => 1],
        ];

        foreach ($tenants as $data) {
            $tenant = Tenant::firstOrCreate(
                ['id' => $data['id']],
                ['data' => ['name' => $data['name']]]
            );

            $tenant->domains()->firstOrCreate(['domain' => $data['domain']]);

            $tenant->tenantInfo()->updateOrCreate(['tenant_id' => $tenant->id], [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'address' => $data['address'],
                'city' => $data['city'],
                'subdomain' => $data['subdomain'],
                'status' => 1
            ]);

            // Run tenant migrations
            Artisan::call('tenants:migrate', [
                '--tenants' => [$tenant->id],
                '--force' => true,
            ]);

            // Run tenant-specific seeders (folder Database/Seeders/Tenant)
            Artisan::call('tenants:seed', [
                '--tenants' => [$tenant->id],
                '--class' => 'Database\\Seeders\\TenantSeeder',
                '--force' => true,
            ]);
        }
    }
}