<?php

namespace Database\Seeders\Platform;

use App\Models\Platform\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PlatformAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $accounts = [
            ['email' => 'admin@platform.com', 'name' => 'Platform Admin'],
            // Dev convenience — same password as tenant demo accounts
            ['email' => 'admin@educenter.com', 'name' => 'Platform Super Admin'],
            ['email' => 'superadmin@educenter.com', 'name' => 'Super Admin'],
        ];

        foreach ($accounts as $account) {
            Admin::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make('password'),
                ]
            );
        }
    }
}
