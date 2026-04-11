<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Stancl\Tenancy\Contracts\Tenant;

class SetupTenant implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public Tenant $tenant;

    public function __construct(Tenant $tenant)
    {
        $this->tenant = $tenant;
    }

    public function handle()
    {
        // Refresh the tenant from the DB with the relation
        $tenant = \App\Models\Platform\Tenant::with('tenantInfo')->find($this->tenant->id);
        $tenantInfo = \App\Models\Platform\TenantInfo::where('tenant_id', $this->tenant->id)
        ->first();
    
       
        tenancy()->initialize($tenant);
    
        Artisan::call('db:seed', [
            '--class' => 'Database\\Seeders\\RoleAndPermissionSeeder',
            '--force' => true
        ]);
    
        $tenancyDbName = $tenant->tenancy_db_name ?? '';
        $subdomain = preg_replace('/^tenant_(.+?)_\d+$/', '$1', $tenancyDbName) ?: 'default';
        
        \Log::info('tenant data' ,[
           'subdomain' => $subdomain,
        ]);

        $user = \App\Models\User::create([
            'name' => 'Super Admin',
            'email' => 'admin@' . $subdomain . '.com',
            'password' => bcrypt('password'),
        ]);
    
        $user->assignRole('admin');
    
        tenancy()->end();
    }
    
}
